import { PDFDocument } from "pdf-lib";

export const compressPdf = async (
  file: File,
): Promise<{ success: boolean; url: string; message: string }> => {
  try {
    const fileBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(fileBuffer);

    // Attempt to save with object streams to potentially reduce size
    const pdfBytes = await pdf.save({ useObjectStreams: true });
    const blob = new Blob([pdfBytes as any], { type: "application/pdf" });

    return {
      success: true,
      url: URL.createObjectURL(blob),
      message: "PDF compressed! (Best effort client-side optimization)",
    };
  } catch (error) {
    console.error("Compress failed", error);
    return {
      success: false,
      url: "",
      message: "Failed to compress PDF. Please try again.",
    };
  }
};
