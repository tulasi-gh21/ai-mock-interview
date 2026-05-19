export const runtime = "nodejs";

import pdfParse from "pdf-parse";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("resume") as File | null;

    if (!file) {
      return Response.json({
        success: false,
        text: "",
        error: "No resume file uploaded.",
      });
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return Response.json({
        success: false,
        text: "",
        error: "Only PDF resumes are supported right now.",
      });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const data = await pdfParse(buffer);

    return Response.json({
      success: true,
      text: data.text || "",
      error: "",
    });
  } catch (error) {
    console.error("Resume extraction error:", error);

    return Response.json({
      success: false,
      text: "",
      error: "Failed to extract resume text.",
    });
  }
}