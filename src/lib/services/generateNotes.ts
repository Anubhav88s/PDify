/**
 * Generate comprehensive study notes from a topic/syllabus text or uploaded PDF.
 * Uses Gemini via Firebase AI Logic.
 */
import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";
import app from "@/lib/firebase";

export type NotesMode = "detailed" | "quick" | "flashcards";

export interface GenerateNotesResult {
  success: boolean;
  notes: string;
  message: string;
  mode: NotesMode;
  usedOcr: boolean;
}

const MODEL_NAME = "gemini-2.5-flash";

function getNotesPrompt(mode: NotesMode, input: string, isFromPdf: boolean): string {
  const sourceLabel = isFromPdf
    ? "The following is the syllabus/content extracted from an uploaded PDF document."
    : "The following is a topic or syllabus provided by the user.";

  const inputBlock = `\n---\n\n${sourceLabel}\n\nINPUT:\n${input}`;

  switch (mode) {
    case "quick":
      return `You are an expert academic notes creator. Generate concise, exam-ready quick revision notes from the given syllabus/topic.

Your response MUST follow this exact structure:

## ⚡ Quick Revision Notes

### 📋 Topics Covered
List all the topics/subtopics identified from the input.

### 📝 Key Points
For each topic, provide:
- **Topic Name** — 2-3 bullet points covering the most important facts
- Use simple, memorable language
- Focus on definitions, formulas, key dates, or core principles

### 🔑 Must-Remember Facts
A bullet list of the top 10-15 critical facts/formulas/definitions that are most likely to appear in exams.

### 💡 Quick Tips
3-5 exam tips or mnemonics related to the content.

Keep it concise and scannable. Use markdown formatting for clarity.${inputBlock}`;

    case "flashcards":
      return `You are an expert academic tutor. Generate study flashcards from the given syllabus/topic for active recall practice.

Your response MUST follow this exact structure:

## 🃏 Study Flashcards

### 📋 Topics Covered
List all the topics/subtopics identified from the input, numbered.

### 🎴 Flashcards

Generate 20-30 flashcards covering ALL topics. Format each flashcard as:

---
**Card [number]** | *[Topic Name]*
**Q:** [Clear, specific question]
**A:** [Concise, accurate answer]

---

Include a mix of:
- Definition cards (What is...?)
- Concept cards (Explain...?)
- Application cards (How does X relate to Y?)
- Comparison cards (Difference between X and Y?)

### 📊 Self-Assessment Checklist
A checklist of key concepts — the student should be able to explain each one:
- [ ] Concept 1
- [ ] Concept 2
- [ ] etc.

Make the questions specific and answers concise but complete.${inputBlock}`;

    case "detailed":
    default:
      return `You are an expert academic notes creator. Generate comprehensive, well-structured study notes from the given syllabus/topic.

Your response MUST follow this exact structure:

## 📖 Comprehensive Study Notes

### 📋 Syllabus Overview
A brief overview of what the syllabus/topic covers and its scope.

### 📚 Detailed Notes

For EACH topic/subtopic identified in the input, provide a detailed section:

#### 📌 [Topic Name]

**Introduction:** A brief introduction to the topic (2-3 sentences)

**Key Concepts:**
- **Concept 1:** Detailed explanation with examples
- **Concept 2:** Detailed explanation with examples

**Important Definitions:**
- **Term:** Clear definition

**Formulas/Theorems** (if applicable):
- Formula with explanation of variables

**Real-World Applications / Examples:**
- Practical examples or case studies

**Common Mistakes to Avoid:**
- Typical errors students make

---

(Repeat for each topic)

### 🔗 Inter-Topic Connections
How different topics relate to each other.

### 📝 Summary Table
A markdown table summarizing all topics with key points.

| Topic | Key Concept | Important Formula/Fact |
|-------|-------------|----------------------|
| ... | ... | ... |

### 📖 Recommended Study Order
Suggest the best order to study these topics for maximum understanding.

Be thorough, accurate, and use clear language. Cover ALL topics from the input.${inputBlock}`;
  }
}

/**
 * Extract text from a PDF file for syllabus parsing.
 */
async function extractPdfText(file: File): Promise<{ text: string; usedOcr: boolean }> {
  // @ts-ignore
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const bufferForText = arrayBuffer.slice(0);

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

  if (!hasText) {
    // OCR fallback
    const bufferForOcr = arrayBuffer.slice(0);
    const ai = getAI(app, { backend: new GoogleAIBackend() });
    const model = getGenerativeModel(ai, { model: MODEL_NAME });

    const images = await renderPdfPagesToImages(bufferForOcr);
    const ocrText = await ocrExtractText(images, model);
    return { text: ocrText, usedOcr: true };
  }

  return { text: fullText, usedOcr: false };
}

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

    // @ts-ignore
    await page.render({ canvasContext: ctx, viewport }).promise;

    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    const base64 = dataUrl.split(",")[1];
    images.push(base64);
    canvas.remove();
  }

  return images;
}

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
      "Return ONLY the extracted text, nothing else. " +
      "Separate each page with '--- Page X ---' where X is the page number.";

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = result.response;
    extractedPages.push(response.text());
  }

  return extractedPages.join("\n\n");
}

/**
 * Generate notes from typed topic/syllabus text.
 */
export async function generateNotesFromText(
  topicText: string,
  mode: NotesMode = "detailed"
): Promise<GenerateNotesResult> {
  if (typeof window === "undefined") {
    return {
      success: false,
      notes: "",
      message: "Only supported in browser.",
      mode,
      usedOcr: false,
    };
  }

  try {
    const ai = getAI(app, { backend: new GoogleAIBackend() });
    const model = getGenerativeModel(ai, { model: MODEL_NAME });

    const prompt = getNotesPrompt(mode, topicText, false);
    const result = await model.generateContent(prompt);
    const response = result.response;
    const notes = response.text();

    return {
      success: true,
      notes,
      message: "Notes generated successfully!",
      mode,
      usedOcr: false,
    };
  } catch (error: any) {
    console.error("Generate notes error:", error);
    return {
      success: false,
      notes: "",
      message: `Error: ${error.message || "Failed to generate notes."}`,
      mode,
      usedOcr: false,
    };
  }
}

/**
 * Generate notes from an uploaded syllabus PDF.
 */
export async function generateNotesFromPdf(
  file: File,
  mode: NotesMode = "detailed"
): Promise<GenerateNotesResult> {
  if (typeof window === "undefined") {
    return {
      success: false,
      notes: "",
      message: "Only supported in browser.",
      mode,
      usedOcr: false,
    };
  }

  try {
    const ai = getAI(app, { backend: new GoogleAIBackend() });
    const model = getGenerativeModel(ai, { model: MODEL_NAME });

    // Extract text from PDF
    const { text: extractedText, usedOcr } = await extractPdfText(file);

    if (!extractedText || extractedText.trim().length === 0) {
      return {
        success: false,
        notes: "",
        message: "Could not extract text from this PDF.",
        mode,
        usedOcr,
      };
    }

    const maxChars = 100000;
    const truncatedText =
      extractedText.length > maxChars
        ? extractedText.slice(0, maxChars) + "\n\n[... text truncated due to length ...]"
        : extractedText;

    const prompt = getNotesPrompt(mode, truncatedText, true);
    const result = await model.generateContent(prompt);
    const response = result.response;
    const notes = response.text();

    return {
      success: true,
      notes,
      message: usedOcr
        ? "Notes generated using AI vision (OCR)!"
        : "Notes generated successfully!",
      mode,
      usedOcr,
    };
  } catch (error: any) {
    console.error("Generate notes from PDF error:", error);
    return {
      success: false,
      notes: "",
      message: `Error: ${error.message || "Failed to process PDF."}`,
      mode,
      usedOcr: false,
    };
  }
}
