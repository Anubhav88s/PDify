import { PDFDocument } from "pdf-lib";

export const mergePdfs = async (
  files: File[],
): Promise<{ success: boolean; url: string; message: string }> => {
  if (files.length < 2) {
    return {
      success: false,
      url: "",
      message: "Please select at least 2 files to merge.",
    };
  }

  try {
    const mergedPdf = await PDFDocument.create();
    for (const file of files) {
      const fileBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(fileBuffer);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }
    const pdfBytes = await mergedPdf.save();
    const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
    return {
      success: true,
      url: URL.createObjectURL(blob),
      message: "PDFs merged successfully!",
    };
  } catch (error) {
    console.error("Merge failed", error);
    return {
      success: false,
      url: "",
      message: "Failed to merge PDFs. Please try again.",
    };
  }
};
