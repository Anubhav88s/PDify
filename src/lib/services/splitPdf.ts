import { PDFDocument } from "pdf-lib";

export const splitPdf = async (
  file: File,
  range: string,
): Promise<{ success: boolean; url: string; message: string }> => {
  if (!range) {
    return { success: false, url: "", message: "No range specified." };
  }

  try {
    const fileBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(fileBuffer);
    const totalPages = pdf.getPageCount();
    const newPdf = await PDFDocument.create();

    // Parse range string "1-3, 5"
    const pageIndices = new Set<number>();
    const parts = range.split(",").map((p) => p.trim());

    for (const part of parts) {
      if (part.includes("-")) {
        const [start, end] = part.split("-").map((n) => parseInt(n));
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = start; i <= end; i++) {
            if (i >= 1 && i <= totalPages) pageIndices.add(i - 1);
          }
        }
      } else {
        const pageNum = parseInt(part);
        if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
          pageIndices.add(pageNum - 1);
        }
      }
    }

    const indicesArray = Array.from(pageIndices).sort((a, b) => a - b);

    if (indicesArray.length === 0) {
      return {
        success: false,
        url: "",
        message: "Invalid page range or no pages selected.",
      };
    }

    const copiedPages = await newPdf.copyPages(pdf, indicesArray);
    copiedPages.forEach((page) => newPdf.addPage(page));

    const pdfBytes = await newPdf.save();
    const blob = new Blob([pdfBytes as any], { type: "application/pdf" });

    return {
      success: true,
      url: URL.createObjectURL(blob),
      message: "PDF split successfully!",
    };
  } catch (error) {
    console.error("Split failed", error);
    return {
      success: false,
      url: "",
      message: "Failed to split PDF. Please check the page range.",
    };
  }
};
