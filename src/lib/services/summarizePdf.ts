/**
 * Extract text from a PDF file, then call Gemini via Firebase AI Logic.
 * Supports multiple summarization modes and OCR fallback for scanned PDFs.
 */
import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";
import app from "@/lib/firebase";

export type SummarizeMode = "standard" | "exam" | "chapter";

export interface SummarizeResult {
  success: boolean;
  summary: string;
  message: string;
  mode: SummarizeMode;
  usedOcr: boolean;
}

const MODEL_NAME = "gemini-2.5-flash";

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

/**
 * Uses Gemini Vision to extract text from PDF page images (OCR fallback).
 */
async function ocrExtractText(
  base64Images: string[],
  model: any
): Promise<string> {
  const extractedPages: string[] = [];
  const batchSize = 5;

  for (let i = 0; i < base64Images.length; i += batchSize) {
    const batch = base64Images.slice(i, i + batchSize);
    const imageParts = batch.map((b64) => ({
      inlineData: {
        mimeType: "image/jpeg" as const,
        data: b64,
      },
    }));

    const prompt =
      "Extract ALL text from these document page images. " +
      "Preserve the original structure, headings, paragraphs, lists, and tables as closely as possible. " +
      "If the text is handwritten, do your best to transcribe it accurately. " +
      "Return ONLY the extracted text, nothing else. " +
      "Separate each page with '--- Page X ---' where X is the page number.";

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = result.response;
    extractedPages.push(response.text());
  }

  return extractedPages.join("\n\n");
}

/**
 * Render PDF pages to base64 JPEG images for OCR fallback.
 */
async function renderPdfPagesToImages(
  arrayBuffer: ArrayBuffer,
  maxPages: number = 15
): Promise<string[]> {
  // @ts-ignore
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const totalPages = Math.min(pdf.numPages, maxPages);
  const images: string[] = [];

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1.5 });

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d")!;

    // @ts-ignore — pdfjs-dist v5 type mismatch, works at runtime
    await page.render({ canvasContext: ctx, viewport }).promise;

    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    const base64 = dataUrl.split(",")[1];
    images.push(base64);
    canvas.remove();
  }

  return images;
}

export async function summarizePdf(
  file: File,
  mode: SummarizeMode = "standard"
): Promise<SummarizeResult> {
  if (typeof window === "undefined") {
    return {
      success: false,
      summary: "",
      message: "Only supported in browser.",
      mode,
      usedOcr: false,
    };
  }

  try {
    // Initialize Firebase AI with GoogleAI backend (uses Firebase API key automatically)
    const ai = getAI(app, { backend: new GoogleAIBackend() });
    const model = getGenerativeModel(ai, { model: MODEL_NAME });

    const originalBuffer = await file.arrayBuffer();
    const bufferForText = originalBuffer.slice(0);
    const bufferForOcr = originalBuffer.slice(0);

    // 1. Try standard text extraction
    // @ts-ignore
    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

    const pdf = await pdfjsLib.getDocument({ data: bufferForText }).promise;
    const totalPages = pdf.numPages;

    let fullText = "";
    for (let i = 1; i <= totalPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(" ");
      fullText += `\n--- Page ${i} ---\n${pageText}`;
    }

    const hasText = fullText.trim().length > 50;

    // 2. If no text extracted, fall back to OCR via Gemini Vision
    if (!hasText) {
      try {
        const images = await renderPdfPagesToImages(bufferForOcr);
        const ocrText = await ocrExtractText(images, model);

        if (!ocrText || ocrText.trim().length === 0) {
          return {
            success: false,
            summary: "",
            message: "Could not extract text from this PDF.",
            mode,
            usedOcr: true,
          };
        }

        const maxChars = 100000;
        const truncatedText =
          ocrText.length > maxChars
            ? ocrText.slice(0, maxChars) + "\n\n[... text truncated due to length ...]"
            : ocrText;

        const prompt = getPromptForMode(mode, truncatedText);
        const result = await model.generateContent(prompt);
        const response = result.response;
        const summary = response.text();

        return {
          success: true,
          summary,
          message: "Summary generated using AI vision (OCR)!",
          mode,
          usedOcr: true,
        };
      } catch (ocrError: any) {
        return {
          success: false,
          summary: "",
          message:
            "Could not extract text from this PDF. OCR failed: " +
            (ocrError.message || "Unknown error"),
          mode,
          usedOcr: true,
        };
      }
    }

    // 3. Text found — call Gemini directly via Firebase AI
    const maxChars = 100000;
    const truncatedText =
      fullText.length > maxChars
        ? fullText.slice(0, maxChars) + "\n\n[... text truncated due to length ...]"
        : fullText;

    const prompt = getPromptForMode(mode, truncatedText);
    const result = await model.generateContent(prompt);
    const response = result.response;
    const summary = response.text();

    return {
      success: true,
      summary,
      message: "Summary generated successfully!",
      mode,
      usedOcr: false,
    };
  } catch (error: any) {
    console.error("Summarize PDF error:", error);
    return {
      success: false,
      summary: "",
      message: `Error: ${error.message || "Failed to process PDF."}`,
      mode,
      usedOcr: false,
    };
  }
}
