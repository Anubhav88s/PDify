/**
 * Extract text from a PDF file, then call the summarize API.
 * Returns the summary string.
 */
export async function summarizePdf(
  file: File
): Promise<{ success: boolean; summary: string; message: string }> {
  if (typeof window === "undefined") {
    return { success: false, summary: "", message: "Only supported in browser." };
  }
  try {
    // 1. Extract text from PDF
    const arrayBuffer = await file.arrayBuffer();

    // @ts-ignore
    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
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

    if (fullText.trim().length === 0) {
      return {
        success: false,
        summary: "",
        message:
          "Could not extract text from this PDF. It may be an image-based or scanned PDF.",
      };
    }

    // 2. Call the summarize API
    const response = await fetch("/api/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: fullText }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        summary: "",
        message: data.error || "Failed to generate summary.",
      };
    }

    return {
      success: true,
      summary: data.summary,
      message: "Summary generated successfully!",
    };
  } catch (error: any) {
    console.error("Summarize PDF error:", error);
    return {
      success: false,
      summary: "",
      message: `Error: ${error.message || "Failed to process PDF."}`,
    };
  }
}
