import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: "No text provided for summarization." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE") {
      return NextResponse.json(
        { error: "Gemini API key is not configured. Please add your API key to .env.local" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Truncate very long text to stay within token limits
    const maxChars = 100000;
    const truncatedText =
      text.length > maxChars
        ? text.slice(0, maxChars) + "\n\n[... text truncated due to length ...]"
        : text;

    const prompt = `You are an expert document summarizer. Analyze the following PDF document text and provide a comprehensive, well-structured summary.

Your summary should include:
1. **Document Overview** - A brief 2-3 sentence overview of what the document is about
2. **Key Points** - The main ideas, arguments, or findings (use bullet points)
3. **Important Details** - Notable data, statistics, dates, names, or figures mentioned
4. **Conclusion** - A concise conclusion or takeaway from the document

Format your response in clean markdown. Be thorough but concise.

---

DOCUMENT TEXT:
${truncatedText}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text();

    return NextResponse.json({ summary });
  } catch (error: any) {
    console.error("Summarize API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate summary." },
      { status: 500 }
    );
  }
}
