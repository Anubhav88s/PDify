import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export const wordToPdf = async (
  file: File,
): Promise<{ success: boolean; url: string; message: string }> => {
  let container: HTMLDivElement | null = null;
  try {
    const arrayBuffer = await file.arrayBuffer();
    // Dynamic import
    // @ts-ignore
    const { renderAsync } = await import("docx-preview");

    // Create a temporary container
    container = document.createElement("div");
    // Start hidden but available for rendering arithmetic
    container.style.position = "absolute";
    container.style.left = "-9999px";
    container.style.top = "0";
    container.style.width = "794px"; // A4 @ 96dpi
    container.style.backgroundColor = "#fff";

    // Injecting CSS to slightly condense content and force white backgrounds
    const style = document.createElement("style");
    style.innerHTML = `
        .docx-wrapper { background: white !important; padding: 0 !important; }
        .docx-wrapper > section { box-shadow: none !important; margin-bottom: 0 !important; }
        * { color-adjust: exact; -webkit-print-color-adjust: exact; }
      `;
    container.appendChild(style);
    document.body.appendChild(container);

    // Render DOCX to HTML
    await renderAsync(arrayBuffer, container, undefined, {
      inWrapper: true,
      ignoreWidth: false,
      ignoreHeight: false,
      breakPages: true,
      useBase64URL: true,
    });

    // Convert HTML to PDF via canvas
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    });

    const wrapper = container.querySelector(".docx-wrapper");
    if (!wrapper) throw new Error("Rendering wrapper not found");

    const pages = wrapper.querySelectorAll("section");

    if (pages.length === 0) {
      // Fallback if no sections found (maybe simple doc)
      // Just try to capture the wrapper
      const canvas = await html2canvas(wrapper as HTMLElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    } else {
      for (let i = 0; i < pages.length; i++) {
        const section = pages[i] as HTMLElement;
        if (i > 0) pdf.addPage();

        const canvas = await html2canvas(section, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
        });

        const imgData = canvas.toDataURL("image/jpeg", 0.95);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
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
