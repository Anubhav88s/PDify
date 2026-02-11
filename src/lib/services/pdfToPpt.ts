export const pdfToPpt = async (
  file: File,
): Promise<{ success: boolean; url: string; message: string }> => {
  console.log("Starting PDF to PPT conversion (Dynamic)");

  if (typeof window === "undefined") {
    return {
      success: false,
      url: "",
      message: "PDF to PPT conversion is only supported in the browser.",
    };
  }

  try {
    // Dynamic imports to avoid SSR issues
    const [pdfjsLib, pptxgenModule] = await Promise.all([
      // @ts-ignore
      import("pdfjs-dist"),
      import("pptxgenjs"),
    ]);

    const pptxgen = pptxgenModule.default;

    // FIX: Use unpkg with https and .mjs
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

    const arrayBuffer = await file.arrayBuffer();
    // @ts-ignore
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const totalPages = pdf.numPages;
    console.log(`PDF loaded, total pages: ${totalPages}`);

    const pptx = new pptxgen();

    // Set layout based on first page
    let pptWidth = 10;
    let pptHeight = 7.5;

    if (totalPages > 0) {
      const firstPage = await pdf.getPage(1);
      const view = firstPage.getViewport({ scale: 1.0 });
      pptWidth = view.width / 72;
      pptHeight = view.height / 72;
      pptx.defineLayout({
        name: "custom",
        width: pptWidth,
        height: pptHeight,
      });
      pptx.layout = "custom";
      console.log(`PPT Layout set to: ${pptWidth}x${pptHeight} inches`);
    }

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      console.log(`Processing page ${pageNum}/${totalPages}`);
      try {
        const page = await pdf.getPage(pageNum);
        const scale = 2; // Higher scale for better quality
        const viewport = page.getViewport({ scale });

        // Render page to canvas
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");

        if (ctx) {
          // FIX: Added 'canvas' property to render call
          // @ts-ignore
          await page.render({
            canvasContext: ctx,
            viewport,
            canvas: canvas,
          }).promise;

          // Convert canvas to data URL
          const dataUrl = canvas.toDataURL("image/png");

          // Add slide with page image
          const slide = pptx.addSlide();
          slide.addImage({
            data: dataUrl,
            x: 0,
            y: 0,
            w: pptWidth,
            h: pptHeight,
          });
        } else {
          console.error(`Failed to get canvas context for page ${pageNum}`);
        }
      } catch (pageErr) {
        console.error(`Error processing page ${pageNum}`, pageErr);
      }
    }

    console.log("Generating PPT buffer");
    // @ts-ignore
    const pptData = await pptx.write("arraybuffer");

    const blob = new Blob([pptData as ArrayBuffer], {
      type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    });

    return {
      success: true,
      url: URL.createObjectURL(blob),
      message: `PDF converted to PPT successfully! (${totalPages} slides)`,
    };
  } catch (error) {
    console.error("PDF to PPT failed", error);
    return {
      success: false,
      url: "",
      message: "Failed to convert PDF to PPT: " + (error as any).message,
    };
  }
};
