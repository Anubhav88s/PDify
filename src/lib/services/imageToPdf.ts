import { PDFDocument } from "pdf-lib";

export const imageToPdf = async (
  files: File | File[],
): Promise<{ success: boolean; url: string; message: string }> => {
  try {
    const pdf = await PDFDocument.create();
    const fileArray = Array.isArray(files) ? files : [files];

    for (const file of fileArray) {
      const imageBytes = await file.arrayBuffer();
      let image;

      if (file.type === "image/jpeg" || file.type === "image/jpg") {
        image = await pdf.embedJpg(imageBytes);
      } else if (file.type === "image/png") {
        image = await pdf.embedPng(imageBytes);
      }

      if (image) {
        const page = pdf.addPage([image.width, image.height]);
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: image.width,
          height: image.height,
        });
      }
    }

    const pdfBytes = await pdf.save();
    const blob = new Blob([pdfBytes as any], { type: "application/pdf" });

    return {
      success: true,
      url: URL.createObjectURL(blob),
      message: "Image converted to PDF successfully!",
    };
  } catch (error) {
    console.error("Image convert failed", error);
    return {
      success: false,
      url: "",
      message: "Failed to convert image. Please try again.",
    };
  }
};
