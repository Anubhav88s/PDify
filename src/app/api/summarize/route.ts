import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ocrExtractText } from "./ocrExtract";

type SummarizeMode = "standard" | "exam" | "chapter";

function getPromptForMode(mode: SummarizeMode, text: string): string {
  const documentBlock = `\n---\n\nDOCUMENT TEXT:\n${text}`;

  switch (mode) {
    case "exam":
      return `You are an expert academic tutor. Analyze the following document and create comprehensive study material.

Your response MUST follow this exact structure with these markdown headers:

## 📚 Key Definitions
List every important term, concept, or keyword mentioned in the document with a clear, concise definition for each. Format as:
- **Term**: Definition

## 🧠 Core Concepts
Explain the fundamental ideas, theories, or principles covered in the document. Each concept should be a short paragraph with:
- The concept name in bold
- A clear explanation
- Why it matters

## 📝 Practice Questions

### Short Answer Questions
Generate 5-8 short answer questions that test understanding of the material. Format as:
1. **Q:** Question text
   **A:** Answer text

### Multiple Choice Questions
Generate 3-5 multiple choice questions. Format as:
1. **Q:** Question text
   - a) Option A
   - b) Option B
   - c) Option C
   - d) Option D
   **Answer:** Correct option with brief explanation

### Essay/Discussion Questions
Generate 2-3 deeper thinking questions that require analysis or synthesis of the material.

Be thorough and cover ALL important material from the document.${documentBlock}`;

    case "chapter":
      return `You are an expert document analyzer. Analyze the following document and provide a detailed section-by-section breakdown.

First, detect the document's structure — look for chapters, sections, headings, topic changes, or logical divisions. If the document doesn't have explicit sections, divide it into logical thematic parts.

Your response MUST follow this exact structure:

## 📖 Document Overview
A brief 2-3 sentence overview of the entire document, its purpose, and scope.

## 📑 Section-by-Section Breakdown

For EACH section/chapter detected, provide:

### 📌 [Section/Chapter Title or Topic]
**Pages/Location:** Where this section appears (if detectable)
**Summary:** A detailed summary of this section (3-5 sentences minimum)
**Key Takeaways:**
- Bullet point of important information from this section
- Another key takeaway

---

(Repeat for each section)

## 🔗 How Sections Connect
A brief paragraph explaining how the sections relate to each other and the overall document flow.

Be thorough — identify ALL distinct sections in the document, even if there are many.${documentBlock}`;

    case "standard":
    default:
      return `You are an expert document summarizer. Analyze the following PDF document text and provide a comprehensive, well-structured summary.

Your summary should include:
1. **Document Overview** - A brief 2-3 sentence overview of what the document is about
2. **Key Points** - The main ideas, arguments, or findings (use bullet points)
3. **Important Details** - Notable data, statistics, dates, names, or figures mentioned
4. **Conclusion** - A concise conclusion or takeaway from the document

Format your response in clean markdown. Be thorough but concise.${documentBlock}`;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, mode = "standard", images } = body as {
      text?: string;
      mode?: SummarizeMode;
      images?: string[]; // base64 JPEG images for OCR
    };

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE") {
      return NextResponse.json(
        { error: "Gemini API key is not configured. Please add your API key to .env.local" },
        { status: 500 }
      );
    }

    let documentText = text || "";

    // If images are provided (OCR fallback), extract text from them
    if ((!documentText || documentText.trim().length === 0) && images && images.length > 0) {
      try {
        documentText = await ocrExtractText(images, apiKey);
      } catch (ocrError: any) {
        console.error("OCR extraction error:", ocrError);
        return NextResponse.json(
          { error: "Failed to extract text from scanned document. Please try again." },
          { status: 500 }
        );
      }
    }

    if (!documentText || documentText.trim().length === 0) {
      return NextResponse.json(
        { error: "No text provided for summarization." },
        { status: 400 }
      );
    }

    // Truncate very long text to stay within token limits
    const maxChars = 100000;
    const truncatedText =
      documentText.length > maxChars
        ? documentText.slice(0, maxChars) + "\n\n[... text truncated due to length ...]"
        : documentText;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = getPromptForMode(mode as SummarizeMode, truncatedText);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text();

    return NextResponse.json({
      summary,
      mode,
      usedOcr: !!(images && images.length > 0 && (!text || text.trim().length === 0)),
    });
  } catch (error: any) {
    console.error("Summarize API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate summary." },
      { status: 500 }
    );
  }
}
