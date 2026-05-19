function fallbackQuestions() {
  return [
    "Tell me about yourself.",
    "Explain one relevant experience from your background.",
    "What skills make you suitable for this role?",
    "Why should we hire you?",
    "Describe a challenge you solved.",
    "How do you handle responsibility at work?",
    "What tools, methods, or systems have you used before?",
    "How do you work in a team?",
    "What are your strengths?",
    "What skills do you still need to improve?",
    "Where do you see yourself growing in this role?",
    "Why are you interested in this position?",
  ];
}

function cleanText(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s+#.]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractRequirementPhrases(text: string) {
  const cleaned = cleanText(text);

  const skillKeywords = [
    "javascript",
    "typescript",
    "react",
    "next.js",
    "nextjs",
    "firebase",
    "node.js",
    "nodejs",
    "python",
    "java",
    "java 21",
    "c++",
    "c#",
    ".net",
    "html",
    "css",
    "xml",
    "json",
    "sql",
    "groovy",
    "cxml",
    "azure",
    "aws",
    "cloud",
    "docker",
    "kubernetes",
    "git",
    "github",
    "api",
    "rest api",
    "frontend",
    "backend",
    "full stack",
    "testing",
    "debugging",
    "troubleshooting",
    "software documentation",
    "medical device",
    "medical devices",
    "regulatory requirements",
    "quality standards",
    "compliance",
    "ai vision",
    "computer vision",
    "machine learning",
    "data pipelines",
    "mobile applications",
    "web applications",
    "assistive technology",
    "access to work",
    "screen reader",
    "screen readers",
    "accessibility",
    "reasonable adjustments",
    "workplace adjustments",
    "employment support",
    "job search",
    "job applications",
    "cv writing",
    "interview preparation",
    "training",
    "safeguarding",
    "welfare benefits",
    "communication",
    "customer service",
    "problem solving",
    "teamwork",
    "organisation",
    "collaboration",
    "partnership",
  ];

  return skillKeywords.filter((skill) => cleaned.includes(skill));
}

function analyzeAts(resumeText: string, jobDescription: string) {
  const resume = cleanText(resumeText);
  const requirements = extractRequirementPhrases(jobDescription);

  if (requirements.length === 0) {
    return {
      atsScore: 0,
      missingSkills: ["No clear skills found in job description"],
    };
  }

  const weightedSkills: Record<string, number> = {
    "medical device": 5,
    "medical devices": 5,
    "regulatory requirements": 5,
    "quality standards": 5,
    compliance: 5,
    "ai vision": 4,
    "computer vision": 4,
    "machine learning": 4,
    cloud: 4,
    aws: 4,
    azure: 4,
    "data pipelines": 4,
    "mobile applications": 3,
    "web applications": 3,
    "access to work": 4,
    "employment support": 4,
    "job search": 3,
    "job applications": 3,
    "cv writing": 3,
    "interview preparation": 3,
    safeguarding: 3,
    "welfare benefits": 3,
    "assistive technology": 4,
    accessibility: 3,
    "reasonable adjustments": 4,
    "workplace adjustments": 4,
  };

  let totalWeight = 0;
  let matchedWeight = 0;
  const missingSkills: string[] = [];

  requirements.forEach((skill) => {
    const weight = weightedSkills[skill] || 1;
    totalWeight += weight;

    const words = skill.split(" ").filter((word) => word.length > 1);

    let matchedWords = 0;

    for (const word of words) {
      const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");

      if (regex.test(resume)) {
        matchedWords++;
      }
    }

    const matchPercentage = matchedWords / words.length;

    if (matchPercentage >= 0.8) {
      matchedWeight += weight;
    } else {
      missingSkills.push(skill);
    }
  });

  const score = Math.round((matchedWeight / totalWeight) * 100);

  return {
    atsScore: Math.min(92, Math.max(10, score)),
    missingSkills:
      missingSkills.length > 0
        ? missingSkills.slice(0, 8)
        : ["Strong match with the job description"],
  };
}

export async function POST(request: Request) {
  try {
    const { candidateName, resumeText, resumeFileName, jobDescription } =
      await request.json();

    const resumeContent = resumeText || resumeFileName || "";
    const atsAnalysis = analyzeAts(resumeContent, jobDescription || "");

    const prompt = `
You are an AI mock interviewer.

Use the resume and job description to generate exactly 12 role-specific interview questions.
Do NOT calculate ATS score.
Do NOT include markdown.
Return ONLY valid JSON.

Format:
{
  "questions": [
    "Question 1",
    "Question 2"
  ]
}

Candidate Name:
${candidateName}

Resume:
${resumeContent}

Job Description:
${jobDescription}
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!text) {
      return Response.json({
        questions: fallbackQuestions(),
        atsScore: atsAnalysis.atsScore,
        missingSkills: atsAnalysis.missingSkills,
      });
    }

    const cleanedText = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const result = JSON.parse(cleanedText);

    return Response.json({
      questions: Array.isArray(result.questions)
        ? result.questions.slice(0, 12)
        : fallbackQuestions(),
      atsScore: atsAnalysis.atsScore,
      missingSkills: atsAnalysis.missingSkills,
    });
  } catch (error) {
    return Response.json({
      questions: fallbackQuestions(),
      atsScore: 0,
      missingSkills: ["Unable to analyze resume and job description"],
    });
  }
}