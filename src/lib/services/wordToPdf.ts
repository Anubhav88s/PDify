import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

// A4 at 96 DPI
const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;
// Scale for higher quality capture
const CAPTURE_SCALE = 2;

/**
 * Helper: takes a tall canvas and slices it into A4-page-height chunks,
 * adding each as a page to the PDF.
 */
function addCanvasPagesToPdf(
  fullCanvas: HTMLCanvasElement,
  pdf: jsPDF,
  pdfPageWidth: number,
  pdfPageHeight: number,
  isFirstPageOfPdf: boolean,
) {
  const scaledPageWidth = A4_WIDTH_PX * CAPTURE_SCALE;
  const scaledPageHeight = A4_HEIGHT_PX * CAPTURE_SCALE;
  const totalHeight = fullCanvas.height;
  const totalPages = Math.ceil(totalHeight / scaledPageHeight);

  for (let page = 0; page < totalPages; page++) {
    // Add new PDF page (skip for the very first page of the PDF)
    if (!(page === 0 && isFirstPageOfPdf)) {
      pdf.addPage();
    }

    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = scaledPageWidth;
    pageCanvas.height = scaledPageHeight;
    const ctx = pageCanvas.getContext("2d")!;

    // White background (important for last page which may be shorter)
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, scaledPageWidth, scaledPageHeight);

    const sourceY = page * scaledPageHeight;
    const sourceHeight = Math.min(scaledPageHeight, totalHeight - sourceY);

    ctx.drawImage(
      fullCanvas,
      0, sourceY, scaledPageWidth, sourceHeight,
      0, 0, scaledPageWidth, sourceHeight,
    );

    const imgData = pageCanvas.toDataURL("image/jpeg", 0.95);
    pdf.addImage(imgData, "JPEG", 0, 0, pdfPageWidth, pdfPageHeight);
  }
}

export const wordToPdf = async (
  file: File,
): Promise<{ success: boolean; url: string; message: string }> => {
  let container: HTMLDivElement | null = null;
  try {
    const arrayBuffer = await file.arrayBuffer();
    // @ts-ignore
    const { renderAsync } = await import("docx-preview");

    container = document.createElement("div");
    container.style.position = "absolute";
    container.style.left = "-9999px";
    container.style.top = "0";
    container.style.width = `${A4_WIDTH_PX}px`;
    container.style.backgroundColor = "#fff";

    const style = document.createElement("style");
    style.innerHTML = `
        .docx-wrapper { background: white !important; padding: 0 !important; }
        .docx-wrapper > section {
          box-shadow: none !important;
          margin: 0 !important;
          width: ${A4_WIDTH_PX}px !important;
          box-sizing: border-box !important;
        }
        * { color-adjust: exact; -webkit-print-color-adjust: exact; }
      `;
    container.appendChild(style);
    document.body.appendChild(container);

    // Render DOCX to HTML with page breaks
    await renderAsync(arrayBuffer, container, undefined, {
      inWrapper: true,
      ignoreWidth: false,
      ignoreHeight: false,
      breakPages: true,
      useBase64URL: true,
    });

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    });

    const pdfPageWidth = pdf.internal.pageSize.getWidth();
    const pdfPageHeight = pdf.internal.pageSize.getHeight();

    const wrapper = container.querySelector(".docx-wrapper") as HTMLElement;
    if (!wrapper) throw new Error("Rendering wrapper not found");

    const sections = wrapper.querySelectorAll("section");

    if (sections.length === 0) {
      // Fallback: no sections, capture entire wrapper and slice
      const canvas = await html2canvas(wrapper, {
        scale: CAPTURE_SCALE,
        useCORS: true,
        backgroundColor: "#ffffff",
        width: A4_WIDTH_PX,
        windowWidth: A4_WIDTH_PX,
      });
      addCanvasPagesToPdf(canvas, pdf, pdfPageWidth, pdfPageHeight, true);
    } else {
      // Capture each section individually (respects page breaks),
      // and if a section is taller than A4, slice it into multiple pages.
      let isFirstPage = true;
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i] as HTMLElement;

        const canvas = await html2canvas(section, {
          scale: CAPTURE_SCALE,
          useCORS: true,
          backgroundColor: "#ffffff",
          width: A4_WIDTH_PX,
          windowWidth: A4_WIDTH_PX,
        });

        addCanvasPagesToPdf(canvas, pdf, pdfPageWidth, pdfPageHeight, isFirstPage);
        isFirstPage = false;
      }
    }

    const pdfBlob = pdf.output("blob");
    return {
      success: true,
      url: URL.createObjectURL(pdfBlob),
      message: "Word converted to PDF successfully!",
    };
  } catch (error) {
    console.error("Word to PDF failed", error);
    return {
      success: false,
      url: "",
      message: "Failed to convert Word to PDF. Please try again.",
    };
  } finally {
    if (container && document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
};
