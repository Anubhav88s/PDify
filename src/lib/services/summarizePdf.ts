/**
 * Extract text from a PDF file, then call the summarize API.
 * Supports multiple summarization modes and OCR fallback for scanned PDFs.
 */

export type SummarizeMode = "standard" | "exam" | "chapter";

export interface SummarizeResult {
  success: boolean;
  summary: string;
  message: string;
  mode: SummarizeMode;
  usedOcr: boolean;
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
    const viewport = page.getViewport({ scale: 1.5 }); // Good quality for OCR

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d")!;

    // @ts-ignore — pdfjs-dist v5 type mismatch, works at runtime
    await page.render({ canvasContext: ctx, viewport }).promise;

    // Convert to base64 JPEG (strip the data:image/jpeg;base64, prefix)
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    const base64 = dataUrl.split(",")[1];
    images.push(base64);

    // Clean up
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
    const originalBuffer = await file.arrayBuffer();
    // Clone the buffer because pdfjs-dist detaches it after use
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

    const hasText = fullText.trim().length > 50; // Meaningful text threshold

    // 2. If no text extracted, fall back to OCR via Gemini Vision
    if (!hasText) {
      try {
        const images = await renderPdfPagesToImages(bufferForOcr);

        const response = await fetch("/api/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: "", mode, images }),
        });

        const data = await response.json();

        if (!response.ok) {
          return {
            success: false,
            summary: "",
            message: data.error || "Failed to process scanned document.",
            mode,
            usedOcr: true,
          };
        }

        return {
          success: true,
          summary: data.summary,
          message: "Summary generated using AI vision (OCR)!",
          mode,
          usedOcr: true,
        };
      } catch (ocrError: any) {
        return {
          success: false,
          summary: "",
          message:
            "Could not extract text from this PDF. It may be a scanned document and OCR failed: " +
            (ocrError.message || "Unknown error"),
          mode,
          usedOcr: true,
        };
      }
    }

    // 3. Text found — call summarize API with mode
    const response = await fetch("/api/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: fullText, mode }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        summary: "",
        message: data.error || "Failed to generate summary.",
        mode,
        usedOcr: false,
      };
    }

    return {
      success: true,
      summary: data.summary,
      message: "Summary generated successfully!",
      mode,
      usedOcr: data.usedOcr || false,
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
