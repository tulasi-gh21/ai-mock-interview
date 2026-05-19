"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

type InterviewReport = {
  id: string;
  candidateName: string;
  atsScore: number;
  averageScore: string;
  performance: string;
  createdAt: string;
};

export default function DashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [reports, setReports] = useState<InterviewReport[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      setUserEmail(user.email || "");

      const q = query(
        collection(db, "interview_reports"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);

      const userReports = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<InterviewReport, "id">),
      }));

      setReports(userReports);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const totalReports = reports.length;

  const averageInterviewScore =
    reports.length > 0
      ? (
          reports.reduce(
            (sum, report) => sum + Number(report.averageScore || 0),
            0
          ) / reports.length
        ).toFixed(1)
      : "0";

  const highestScore =
    reports.length > 0
      ? Math.max(...reports.map((r) => Number(r.averageScore || 0))).toFixed(1)
      : "0";

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100">
        <h1 className="text-xl sm:text-2xl font-bold">
          Loading your dashboard...
        </h1>
      </main>
    );
  }

  return (
    <main
      className={`min-h-screen px-4 py-6 sm:px-6 md:px-10 transition-all duration-300 ${
        darkMode ? "bg-black text-white" : "bg-gray-100 text-black"
      }`}
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">
              My Interview Dashboard
            </h1>

            <p
              className={`mt-2 text-sm sm:text-base break-all ${
                darkMode ? "text-gray-300" : "text-gray-600"
              }`}
            >
              Logged in as: {userEmail}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="bg-purple-600 text-white px-5 py-3 rounded-lg text-sm sm:text-base"
            >
              {darkMode ? "Light Mode" : "Dark Mode"}
            </button>

            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-5 py-3 rounded-lg text-sm sm:text-base"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div
            className={`p-5 rounded-xl shadow ${
              darkMode ? "bg-gray-900" : "bg-white"
            }`}
          >
            <h2 className="text-lg font-semibold">Interviews Attended</h2>
            <p className="text-3xl font-bold mt-3">{totalReports}</p>
          </div>

          <div
            className={`p-5 rounded-xl shadow ${
              darkMode ? "bg-gray-900" : "bg-white"
            }`}
          >
            <h2 className="text-lg font-semibold">Average Score</h2>
            <p className="text-3xl font-bold mt-3">
              {averageInterviewScore}/10
            </p>
          </div>

          <div
            className={`p-5 rounded-xl shadow ${
              darkMode ? "bg-gray-900" : "bg-white"
            }`}
          >
            <h2 className="text-lg font-semibold">Highest Score</h2>
            <p className="text-3xl font-bold mt-3">{highestScore}/10</p>
          </div>
        </div>

        <div
          className={`p-5 sm:p-6 rounded-xl shadow mb-8 ${
            darkMode ? "bg-gray-900" : "bg-white"
          }`}
        >
          <h2 className="text-xl sm:text-2xl font-bold mb-4">
            Interview History
          </h2>

          {reports.length === 0 ? (
            <p className={darkMode ? "text-gray-300" : "text-gray-600"}>
              No interview reports yet. Start your first interview.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm sm:text-base">
                <thead>
                  <tr className={darkMode ? "bg-gray-800" : "bg-gray-200"}>
                    <th className="p-3 text-left">Candidate</th>
                    <th className="p-3 text-left">ATS</th>
                    <th className="p-3 text-left">Avg Score</th>
                    <th className="p-3 text-left">Performance</th>
                    <th className="p-3 text-left">Date</th>
                  </tr>
                </thead>

                <tbody>
                  {reports.map((report) => (
                    <tr
                      key={report.id}
                      className={`border-b ${
                        darkMode ? "border-gray-700" : "border-gray-300"
                      }`}
                    >
                      <td className="p-3">{report.candidateName || "N/A"}</td>
                      <td className="p-3">{report.atsScore || 0}/100</td>
                      <td className="p-3">{report.averageScore || "0"}/10</td>
                      <td className="p-3">{report.performance || "N/A"}</td>
                      <td className="p-3">
                        {report.createdAt
                          ? new Date(report.createdAt).toLocaleDateString()
                          : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <button
          onClick={() => router.push("/interview")}
          className="w-full md:w-auto bg-blue-600 text-white px-6 py-3 rounded-lg text-sm sm:text-base"
        >
          Start Interview
        </button>
      </div>
    </main>
  );
}