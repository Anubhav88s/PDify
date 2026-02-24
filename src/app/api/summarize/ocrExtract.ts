import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Uses Gemini Vision to extract text from PDF page images (OCR fallback).
 * Accepts an array of base64-encoded JPEG images and returns the combined extracted text.
 */
export async function ocrExtractText(
  base64Images: string[],
  apiKey: string
): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const extractedPages: string[] = [];

  // Process images in batches of 5 to stay within limits
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
    const response = await result.response;
    extractedPages.push(response.text());
  }

  return extractedPages.join("\n\n");
}
