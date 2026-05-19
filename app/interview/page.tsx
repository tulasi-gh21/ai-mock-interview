"use client";

import { db, auth } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function InterviewPage() {
  const router = useRouter();

  const [darkMode, setDarkMode] = useState(false);
  const [candidateName, setCandidateName] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");

  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string[]>([]);
  const [bestAnswers, setBestAnswers] = useState<string[]>([]);
  const [grammarFixes, setGrammarFixes] = useState<string[]>([]);
  const [scores, setScores] = useState<number[]>([]);

  const [atsScore, setAtsScore] = useState(0);
  const [missingSkills, setMissingSkills] = useState<string[]>([]);
  const [showReport, setShowReport] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(120);

  const totalScore = scores.reduce((a, b) => a + b, 0);
  const averageScore =
    scores.length > 0 ? (totalScore / scores.length).toFixed(1) : "0";

  const performance =
    Number(averageScore) >= 8
      ? "Excellent"
      : Number(averageScore) >= 6
      ? "Good"
      : Number(averageScore) >= 4
      ? "Average"
      : "Needs Improvement";

  const chartData = questions.map((question, index) => ({
    name: `Q${index + 1}`,
    score: scores[index] || 0,
  }));

  const generateQuestions = async () => {
    if (!candidateName || !jobDescription || !resumeFile) {
      alert("Please fill candidate name, upload resume PDF, and job description.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("resume", resumeFile);

      const extractResponse = await fetch("/api/extract-resume", {
        method: "POST",
        body: formData,
      });

      const extractData = await extractResponse.json();

      if (!extractData.success || !extractData.text) {
        alert(extractData.error || "Could not extract resume text.");
        return;
      }

      const response = await fetch("/api/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateName,
          resumeText: extractData.text,
          resumeFileName: resumeFile.name,
          jobDescription,
        }),
      });

      const data = await response.json();
      const generatedQuestions = data.questions || [];

      setQuestions(generatedQuestions);
      setAnswers(new Array(generatedQuestions.length).fill(""));
      setFeedback(new Array(generatedQuestions.length).fill(""));
      setBestAnswers(new Array(generatedQuestions.length).fill(""));
      setGrammarFixes(new Array(generatedQuestions.length).fill(""));
      setScores(new Array(generatedQuestions.length).fill(0));

      setAtsScore(typeof data.atsScore === "number" ? data.atsScore : 75);
      setMissingSkills(data.missingSkills || []);
      setCurrentQuestion(0);
      setTimeLeft(120);
      setShowReport(false);
    } catch (error) {
      console.error(error);
      alert("Error generating questions.");
    }
  };

  const getFeedback = async (index: number) => {
    try {
      const response = await fetch("/api/generate-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: questions[index],
          answer: answers[index],
        }),
      });

      const data = await response.json();

      const updatedFeedback = [...feedback];
      updatedFeedback[index] = data.feedback || "";
      setFeedback(updatedFeedback);

      const updatedBestAnswers = [...bestAnswers];
      updatedBestAnswers[index] = data.bestAnswer || "";
      setBestAnswers(updatedBestAnswers);

      const updatedGrammar = [...grammarFixes];
      updatedGrammar[index] = data.grammarFix || "";
      setGrammarFixes(updatedGrammar);

      const updatedScores = [...scores];
      updatedScores[index] = data.score || 0;
      setScores(updatedScores);
    } catch (error) {
      console.error(error);
      alert("Error generating feedback.");
    }
  };

  const saveReportAndFinish = async () => {
    try {
      await addDoc(collection(db, "interview_reports"), {
        userId: auth.currentUser?.uid || "",
userEmail: auth.currentUser?.email || "",
        candidateName,
        resumeFileName: resumeFile?.name || "",
        jobDescription,
        questions,
        answers,
        feedback,
        bestAnswers,
        grammarFixes,
        scores,
        atsScore,
        missingSkills,
        totalScore,
        averageScore,
        performance,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Firebase save error:", error);
    }

    setShowReport(true);
  };

  useEffect(() => {
    if (!questions.length || showReport) return;

    if (timeLeft === 0) {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion((prev) => prev + 1);
        setTimeLeft(120);
      } else {
        saveReportAndFinish();
      }
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, currentQuestion, questions.length, showReport]);

  const downloadPDF = () => {
    const pdf = new jsPDF();
    let y = 15;

    const addText = (text: string, size = 11) => {
      pdf.setFontSize(size);
      pdf.text(text, 12, y);
      y += 8;
    };

    addText("AI Mock Interview Report", 18);
    addText(`Candidate: ${candidateName}`);
    addText(`ATS Score: ${atsScore}/100`);
    addText(`Average Score: ${averageScore}/10`);
    addText(`Performance: ${performance}`);

    questions.forEach((q, i) => {
      addText(`Q${i + 1}: ${q}`);
      addText(`Answer: ${answers[i] || "No answer provided"}`);
      addText(`Score: ${scores[i] || 0}/10`);
    });

    pdf.save("AI_Mock_Interview_Report.pdf");
  };

  const goNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setTimeLeft(120);
    } else {
      saveReportAndFinish();
    }
  };

  return (
    <main
      className={`min-h-screen px-4 py-6 sm:px-6 md:px-10 transition-all duration-300 ${
        darkMode ? "bg-black text-white" : "bg-gray-100 text-black"
      }`}
    >
      <div
        className={`w-full max-w-5xl mx-auto p-4 sm:p-6 md:p-8 rounded-xl shadow-lg ${
          darkMode ? "bg-gray-900" : "bg-white"
        }`}
      >
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">
            AI Mock Interview
          </h1>

          <button
            onClick={() => setDarkMode(!darkMode)}
            className="bg-purple-600 text-white px-5 py-3 rounded-lg"
          >
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>
        </div>

        {questions.length === 0 && (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Candidate Name"
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              className="w-full border p-3 rounded-lg text-black"
            />

            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
              className={`w-full border p-3 rounded-lg ${
                darkMode ? "text-white" : "text-black"
              }`}
            />

            <textarea
              placeholder="Paste Job Description Here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="w-full border p-3 rounded-lg h-44 text-black"
            />

            <button
              onClick={generateQuestions}
              className="w-full bg-black text-white p-3 rounded-lg"
            >
              Generate Questions
            </button>
          </div>
        )}

        {questions.length > 0 && !showReport && (
          <div className="space-y-5">
            <div className="bg-green-100 text-black p-4 rounded-lg">
              <h2 className="font-bold text-xl">ATS Score: {atsScore}/100</h2>
              <p className="mt-2 font-semibold">Missing Skills:</p>
              <ul className="list-disc ml-6">
                {missingSkills.map((skill, index) => (
                  <li key={index}>{skill}</li>
                ))}
              </ul>
            </div>

            <div className={`p-5 rounded-lg ${darkMode ? "bg-gray-800" : "bg-gray-200"}`}>
              <p className="text-red-500 font-bold mb-2">
                Time Left: {timeLeft}s
              </p>

              <h2 className="font-bold text-xl mb-3">
                Question {currentQuestion + 1}: {questions[currentQuestion]}
              </h2>

              <textarea
                value={answers[currentQuestion] || ""}
                onChange={(e) => {
                  const updated = [...answers];
                  updated[currentQuestion] = e.target.value;
                  setAnswers(updated);
                }}
                placeholder="Type your answer..."
                className="w-full border p-3 rounded-lg h-36 text-black"
              />

              <button
                onClick={() => getFeedback(currentQuestion)}
                className="mt-3 bg-blue-600 text-white px-5 py-2 rounded-lg"
              >
                Feedback
              </button>

              {feedback[currentQuestion] && (
                <div className="mt-4 bg-white text-black p-4 rounded-lg">
                  <p className="text-green-700 font-semibold">
                    Feedback: {feedback[currentQuestion]}
                  </p>
                  <p className="mt-2">
                    <strong>Best Answer:</strong> {bestAnswers[currentQuestion]}
                  </p>
                  <p className="mt-2">
                    <strong>Grammar Fix:</strong> {grammarFixes[currentQuestion]}
                  </p>
                  <p className="font-bold mt-2">
                    Score: {scores[currentQuestion]}/10
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={goNextQuestion}
              className="w-full bg-blue-600 text-white p-3 rounded-lg"
            >
              {currentQuestion < questions.length - 1
                ? "Next Question"
                : "Finish Interview"}
            </button>

            <button
              onClick={saveReportAndFinish}
              className="w-full bg-green-600 text-white p-3 rounded-lg"
            >
              Finish Interview Now
            </button>
          </div>
        )}

        {showReport && (
          <div className="bg-black text-white p-4 sm:p-6 md:p-8 rounded-xl mt-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-5">
              Final Interview Report
            </h2>

            <div className="bg-slate-900 p-4 sm:p-6 rounded-xl">
              <p>Candidate Name: {candidateName}</p>
              <p className="mt-2">ATS Score: {atsScore}/100</p>
              <p className="mt-2">Total Questions: {questions.length}</p>
              <p className="mt-2">Total Score: {totalScore}</p>
              <p className="mt-2">Average Score: {averageScore}/10</p>

              <p className="text-green-400 text-xl font-bold mt-4">
                Performance: {performance}
              </p>
            </div>

            <div className="bg-white text-black p-4 sm:p-6 rounded-xl mt-6">
              <h2 className="text-xl font-bold mb-4">
                Interview Performance Analytics
              </h2>

              <div className="w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 10]} />
                    <Tooltip />
                    <Bar dataKey="score" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <button
              onClick={downloadPDF}
              className="w-full bg-purple-600 text-white py-3 rounded-lg mt-6"
            >
              Download Report PDF
            </button>

            <button
              onClick={() => router.push("/dashboard")}
              className="w-full bg-blue-600 text-white py-3 rounded-lg mt-4"
            >
              Go To Dashboard
            </button>

            <button
              onClick={() => {
                setQuestions([]);
                setAnswers([]);
                setFeedback([]);
                setBestAnswers([]);
                setGrammarFixes([]);
                setScores([]);
                setAtsScore(0);
                setMissingSkills([]);
                setCurrentQuestion(0);
                setTimeLeft(120);
                setShowReport(false);
              }}
              className="w-full bg-gray-600 text-white py-3 rounded-lg mt-4"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </main>
  );
}