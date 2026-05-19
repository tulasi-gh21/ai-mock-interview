export async function POST(request: Request) {
  try {
    const { question, answer } = await request.json();

    try {
      const prompt = `
You are an expert AI interview evaluator.

Question:
${question}

Candidate Answer:
${answer}

Return ONLY valid JSON in this format:
{
  "feedback": "feedback text",
  "bestAnswer": "best sample answer",
  "grammarFix": "corrected version of the candidate answer",
  "score": 8
}

Rules:
- Feedback should explain strengths and weaknesses.
- Best answer should be professional and realistic.
- Grammar fix should improve spelling and grammar.
- Score must be from 0 to 10.
- Do not use markdown.
`;

      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              response_mime_type: "application/json",
            },
          }),
        }
      );

      if (geminiResponse.ok) {
        const data = await geminiResponse.json();

        const text =
          data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (text) {
          const result = JSON.parse(text);

          return Response.json({
            feedback:
              result.feedback ||
              "Good answer with decent explanation.",
            bestAnswer:
              result.bestAnswer ||
              "Provide a structured and detailed professional answer.",
            grammarFix:
              result.grammarFix || answer,
            score: result.score || 7,
            source: "Gemini AI",
          });
        }
      }
    } catch (error) {
      console.log("AI feedback generation failed.");
    }

    let score = 2;
    let feedback =
      "Your answer is too short and lacks detail.";
    let bestAnswer =
      "Provide a detailed answer with examples, technical explanation, and confidence.";
    let grammarFix = answer;

    if (answer.length > 150) {
      score = 9;
      feedback =
        "Excellent answer with strong explanation and examples.";
    } else if (answer.length > 80) {
      score = 7;
      feedback =
        "Good answer. Add more technical depth and practical examples.";
    } else if (answer.length > 30) {
      score = 5;
      feedback =
        "Average answer. Try adding project examples and clearer explanation.";
    }

    return Response.json({
      feedback,
      bestAnswer,
      grammarFix,
      score,
      source: "Fallback",
    });
  } catch (error) {
    return Response.json({
      feedback:
        "Error generating feedback.",
      bestAnswer:
        "Provide a clear and professional answer.",
      grammarFix: "",
      score: 0,
      source: "Error",
    });
  }
}