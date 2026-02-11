import { mergePdfs } from "./services/mergePdf";
import { splitPdf } from "./services/splitPdf";
import { compressPdf } from "./services/compressPdf";
import { compressImage } from "./services/compressImage";
import { imageToPdf } from "./services/imageToPdf";
import { pdfToImage } from "./services/pdfToImage";
import { pdfToDoc } from "./services/pdfToDoc";
import { pdfToPpt } from "./services/pdfToPpt";
import { wordToPdf } from "./services/wordToPdf";
import { excelToPdf } from "./services/excelToPdf";
import { convertPptxToPdf } from "./services/pptToPdf";

export const processFile = async (
  tool: string,
  files: File | File[],
  options?: any,
): Promise<{ success: boolean; url: string; message: string }> => {
  console.log(`Processing tool: ${tool}`, files);

  // Helper handling single/array files
  const fileArray = Array.isArray(files) ? files : [files];
  const singleFile = Array.isArray(files) ? files[0] : files;

  try {
    switch (tool) {
      // --- PDF Operations ---
      case "Merge PDF":
        return await mergePdfs(fileArray);

      case "Split PDF":
        return await splitPdf(singleFile, options?.range || "");

      case "Compress PDF":
        return await compressPdf(singleFile);

      // --- Image Operations ---
      case "Compress Image":
        return await compressImage(singleFile, options?.compressionLevel);

      case "JPG to PDF":
      case "IMG to PDF":
        return await imageToPdf(files);

      // --- Conversions FROM PDF ---
      case "PDF to JPG":
      case "PDF to Image":
        return await pdfToImage(singleFile);

      case "PDF to Word":
      case "PDF to DOC":
        return await pdfToDoc(singleFile);

      case "PDF to PowerPoint":
      case "PDF to PPT":
        return await pdfToPpt(singleFile);

      // --- Conversions TO PDF ---
      case "Word to PDF":
      case "Convert to PDF":
        if (
          singleFile.name.endsWith(".docx") ||
          singleFile.name.endsWith(".doc")
        ) {
          return await wordToPdf(singleFile);
        }
        if (
          singleFile.name.endsWith(".pptx") ||
          singleFile.name.endsWith(".ppt")
        ) {
          return await convertPptxToPdf(singleFile);
        }
        if (singleFile.type.startsWith("image/")) {
          return await imageToPdf(files);
        }
        // Fallback to excel/other
        return await excelToPdf(files);

      case "PowerPoint to PDF":
        return await convertPptxToPdf(singleFile);

      case "Excel to PDF":
        return await excelToPdf(files);

      default:
        return {
          success: false,
          url: "",
          message: `Tool ${tool} is not yet implemented.`,
        };
    }
  } catch (error) {
    console.error(`Error in ${tool}:`, error);
    return {
      success: false,
      url: "",
      message: `An error occurred while processing: ${(error as any).message}`,
    };
  }
};
