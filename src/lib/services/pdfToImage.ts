export const pdfToImage = async (
  file: File,
): Promise<{ success: boolean; url: string; message: string }> => {
  if (typeof window === "undefined") {
    return { success: false, url: "", message: "Only supported in browser." };
  }
  try {
    const arrayBuffer = await file.arrayBuffer();
    // @ts-ignore
    const pdfjsLib = await import("pdfjs-dist");

    // FIX: Use unpkg with https and .mjs to match installed version and avoid 404
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    // Render the first page
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better quality

    // Create a canvas to render the page
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not get canvas context");

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    // Render the PDF page to canvas
    // FIX: Added 'canvas' property to render call for pdfjs-dist v5 compat
    const renderTask = page.render({
      canvasContext: context,
      viewport: viewport,
      canvas: canvas,
    });
    await renderTask.promise;

    // Convert canvas to a real JPEG blob
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve({
              success: true,
              url: URL.createObjectURL(blob),
              message: `PDF page 1 converted to image! (${pdf.numPages} total pages)`,
            });
          } else {
            resolve({
              success: false,
              url: "",
              message: "Failed to capture image from PDF.",
            });
          }
        },
        "image/jpeg",
        0.92,
      );
    });
  } catch (error) {
    console.error("PDF to Image failed", error);
    return {
      success: false,
      url: "",
      message: "Failed to convert PDF to Image: " + (error as Error).message,
    };
  }
};
