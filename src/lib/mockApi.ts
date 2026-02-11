import { PDFDocument } from "pdf-lib";
import {
  Document as DocxDocument,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  ImageRun,
} from "docx";
// @ts-ignore
import mammoth from "mammoth";
import { jsPDF } from "jspdf";
// @ts-ignore
import { renderAsync } from "docx-preview";

// --- GLOBAL HELPERS ---

// Helper: Convert EMUs to Points (1 inch = 914400 EMUs = 72 pt)
const emuToPt = (emu: number) => emu / 12700;

// Helper: Compress/Resize Image
const compressImage = (
  buffer: ArrayBuffer,
  type: string,
  level: "extreme" | "recommended" | "less" = "recommended",
): Promise<ArrayBuffer> => {
  return new Promise((resolve) => {
    try {
      const blob = new Blob([buffer], { type });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(buffer); // Fallback to original
          return;
        }

        // Resize logic based on level
        let width = img.width;
        let height = img.height;

        const config = {
          extreme: { maxSize: 800, quality: 0.5 },
          recommended: { maxSize: 1500, quality: 0.7 },
          less: { maxSize: 2500, quality: 0.9 },
        }[level];

        const maxSize = config.maxSize;
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        // Determine output format/quality
        const outType = type === "image/jpeg" ? "image/jpeg" : "image/png";
        const quality = type === "image/jpeg" ? config.quality : undefined;

        canvas.toBlob(
          (blob) => {
            if (blob) {
              blob
                .arrayBuffer()
                .then(resolve)
                .catch(() => resolve(buffer));
            } else {
              resolve(buffer);
            }
          },
          outType,
          quality,
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(buffer);
      };
      img.src = url;
    } catch (e) {
      resolve(buffer);
    }
  });
};

// Helper: Convert SVG Blob to PNG ArrayBuffer
const convertSvgToPng = (svgBuffer: ArrayBuffer): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    try {
      const blob = new Blob([svgBuffer], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((pngBlob) => {
            if (pngBlob) {
              pngBlob.arrayBuffer().then(resolve).catch(reject);
            } else {
              reject(new Error("Canvas toBlob failed"));
            }
            URL.revokeObjectURL(url);
          }, "image/png");
        } else {
          reject(new Error("Could not get canvas context"));
        }
      };
      img.onerror = (e) => reject(e);
      img.src = url;
    } catch (e) {
      reject(e);
    }
  });
};

export const processFile = async (
  files: File | File[],
  tool: string,
  options?: {
    range?: string;
    compressionLevel?: "extreme" | "recommended" | "less";
  },
): Promise<{ success: boolean; url: string; message: string }> => {
  // Real implemention for Merge PDF
  if (tool === "Merge PDF" && Array.isArray(files) && files.length > 1) {
    try {
      const mergedPdf = await PDFDocument.create();
      for (const file of files) {
        const fileBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(fileBuffer);
        const copiedPages = await mergedPdf.copyPages(
          pdf,
          pdf.getPageIndices(),
        );
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
  }

  // Real implementation for Split PDF
  if (tool === "Split PDF" && !Array.isArray(files) && options?.range) {
    try {
      const fileBuffer = await files.arrayBuffer();
      const pdf = await PDFDocument.load(fileBuffer);
      const totalPages = pdf.getPageCount();
      const newPdf = await PDFDocument.create();

      // Parse range string "1-3, 5"
      const pageIndices = new Set<number>();
      const parts = options.range.split(",").map((p) => p.trim());

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
  }

  // Real implementation for Compress PDF (Best Effort)
  if (tool === "Compress PDF" && !Array.isArray(files)) {
    try {
      const fileBuffer = await files.arrayBuffer();
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
  }

  // Standalone Compress Image
  if (tool === "Compress Image" && !Array.isArray(files)) {
    try {
      const buffer = await files.arrayBuffer();
      const compressedBuffer = await compressImage(
        buffer,
        files.type,
        options?.compressionLevel,
      );
      const blob = new Blob([compressedBuffer], { type: files.type });
      return {
        success: true,
        url: URL.createObjectURL(blob),
        message: "Image compressed successfully!",
      };
    } catch (error) {
      console.error("Image compression failed", error);
      return {
        success: false,
        url: "",
        message: "Failed to compress image.",
      };
    }
  }

  // JPG to PDF (Real)
  if (
    (tool === "JPG to PDF" || tool === "Convert to PDF") &&
    !Array.isArray(files) &&
    files.type.startsWith("image/")
  ) {
    try {
      const pdf = await PDFDocument.create();
      const imageBytes = await files.arrayBuffer();
      let image;

      if (files.type === "image/jpeg" || files.type === "image/jpg") {
        image = await pdf.embedJpg(imageBytes);
      } else if (files.type === "image/png") {
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
  }

  // --- NEW PDF CONVERSIONS (Simulated/Best Effort) ---

  // PDF to Image (Real Rendering via pdfjs-dist)
  if (tool === "PDF to Image" && !Array.isArray(files)) {
    if (typeof window === "undefined") {
      return { success: false, url: "", message: "Only supported in browser." };
    }
    try {
      const arrayBuffer = await files.arrayBuffer();
      // @ts-ignore
      const pdfjsLib = await import("pdfjs-dist");
      // Set worker
      const version = "5.4.624";
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;

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
      // @ts-ignore
      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;

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
  }

  // PDF to DOC
  if (tool === "PDF to DOC" && !Array.isArray(files)) {
    if (typeof window === "undefined") {
      return { success: false, url: "", message: "Only supported in browser." };
    }
    try {
      const arrayBuffer = await files.arrayBuffer();
      // @ts-ignore
      const pdfjsLib = await import("pdfjs-dist");
      // Set worker
      const version = "5.4.624";
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;

      // Load the PDF file
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const totalPages = pdf.numPages;

      // Extract text pages
      const paragraphs: Paragraph[] = [];

      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();

        // Coordinate-based text extraction
        const items = textContent.items.filter(
          (item: any) => item.str && item.transform,
        );

        // Sort items: Y descending (top to bottom), then X ascending (left to right)
        items.sort((a: any, b: any) => {
          const yA = a.transform[5];
          const yB = b.transform[5];
          if (Math.abs(yA - yB) > 5) {
            // Tolerance for same line
            return yB - yA; // Top to bottom
          }
          return a.transform[4] - b.transform[4]; // Left to right
        });

        const viewport = page.getViewport({ scale: 1.0 });
        const pageWidth = viewport.width;

        let currentY = -1;
        let lineItems: any[] = [];

        // Helper to process a line and add to paragraphs
        const processLine = (items: any[]) => {
          if (items.length === 0) return;

          // Construct text
          const text = items.map((i) => i.str).join(" "); // simplistic spacing

          // Calculate bounds
          const minX = items[0].transform[4];
          const lastItem = items[items.length - 1];
          // simplified width calculation: just use X position of last item + rough char width?
          // transforming width is hard without font info.
          // Let's rely on minX for alignment heuristics primarily.
          const itemWidth = lastItem.width || 0;
          const maxX = lastItem.transform[4] + itemWidth;

          let alignment: (typeof AlignmentType)[keyof typeof AlignmentType] =
            AlignmentType.LEFT;
          const midPoint = (minX + maxX) / 2;
          const pageMid = pageWidth / 2;

          // Heuristics
          if (minX > pageMid) {
            // If it starts way past middle, likely Right aligned?
            // Or maybe just indented.
            // Let's check if it ends near right edge
            // Assuming typical margins of ~50pt
            if (maxX > pageWidth - 100) {
              alignment = AlignmentType.RIGHT;
            } else {
              // Just indented, but maybe check for center relative to page
              if (Math.abs(midPoint - pageMid) < 50) {
                alignment = AlignmentType.CENTER;
              }
            }
          } else {
            // Starts on left side
            if (Math.abs(midPoint - pageMid) < 30) {
              alignment = AlignmentType.CENTER;
            }

            // Refined Center Check:
            // Often centered text has minX approx = pageWidth - maxX
            const rightSpace = pageWidth - maxX;
            if (Math.abs(minX - rightSpace) < 20) {
              alignment = AlignmentType.CENTER;
            }
          }

          paragraphs.push(
            new Paragraph({
              children: [new TextRun(text)],
              alignment: alignment,
            }),
          );
        };

        items.forEach((item: any) => {
          const y = item.transform[5];

          if (currentY === -1) {
            currentY = y;
            lineItems = [item];
          } else if (Math.abs(y - currentY) > 10) {
            // New line threshold (approx line height)
            // Finish previous line
            processLine(lineItems);
            currentY = y;
            lineItems = [item];
          } else {
            // Same line
            lineItems.push(item);
          }
        });

        // Push last line
        processLine(lineItems);

        // --- Image Extraction ---
        try {
          const operatorList = await page.getOperatorList();
          const validImageOps = [
            // @ts-ignore
            pdfjsLib.OPS.paintImageXObject,
            // @ts-ignore
            pdfjsLib.OPS.paintInlineImageXObject,
          ];

          for (let i = 0; i < operatorList.fnArray.length; i++) {
            const op = operatorList.fnArray[i];
            if (validImageOps.includes(op)) {
              const imgName = operatorList.argsArray[i][0];
              if (imgName) {
                try {
                  // Retrieve image object
                  // Note: Common pdf.js pattern to get objects
                  let imgObj: any;
                  try {
                    imgObj = await page.objs.get(imgName);
                  } catch (e) {
                    // Fallback or simple ignore if not found
                    continue;
                  }

                  if (imgObj && imgObj.width && imgObj.height) {
                    // We need to convert this to an image buffer that docx accepts (Buffer, Uint8Array, Blob)
                    // imgObj.data is typically an RGBA Uint8ClampedArray

                    const canvas = document.createElement("canvas");
                    canvas.width = imgObj.width;
                    canvas.height = imgObj.height;
                    const ctx = canvas.getContext("2d");
                    if (ctx) {
                      // Handle different kinds of data
                      let imgData;
                      if (imgObj.bitmap) {
                        ctx.drawImage(imgObj.bitmap, 0, 0);
                      } else if (imgObj.data) {
                        // Likely RGBA
                        const arr = new Uint8ClampedArray(imgObj.data.length);
                        arr.set(imgObj.data);
                        const idata = new ImageData(
                          arr,
                          imgObj.width,
                          imgObj.height,
                        );
                        ctx.putImageData(idata, 0, 0);
                      } else {
                        continue;
                      }

                      const dataUrl = canvas.toDataURL("image/png");
                      const base64Data = dataUrl.split(",")[1];
                      const imgBuffer = Uint8Array.from(atob(base64Data), (c) =>
                        c.charCodeAt(0),
                      );

                      // Sanitize dimensions
                      let finalWidth = imgObj.width;
                      let finalHeight = imgObj.height;

                      if (!Number.isFinite(finalWidth) || finalWidth <= 0)
                        finalWidth = 100;
                      if (!Number.isFinite(finalHeight) || finalHeight <= 0)
                        finalHeight = 100;

                      // Scale down if too large (Word has limits)
                      const MAX_WIDTH = 600;
                      if (finalWidth > MAX_WIDTH) {
                        const scale = MAX_WIDTH / finalWidth;
                        finalWidth = MAX_WIDTH;
                        finalHeight *= scale;
                      }

                      // Ensure integers for Word
                      finalWidth = Math.round(finalWidth);
                      finalHeight = Math.round(finalHeight);

                      if (imgBuffer && imgBuffer.length > 100) {
                        paragraphs.push(
                          new Paragraph({
                            children: [
                              new ImageRun({
                                data: imgBuffer,
                                transformation: {
                                  width: finalWidth,
                                  height: finalHeight,
                                },
                                type: "png",
                              }),
                            ],
                            alignment: AlignmentType.CENTER,
                          }),
                        );
                      }
                    }
                  }
                } catch (err) {
                  console.warn("Failed to extract an image", err);
                }
              }
            }
          }
        } catch (opErr) {
          console.warn("Operator list error", opErr);
        }

        // Add a page break after each page except the last one
        // (docx handles sections, but simple paragraphs logic here)
        if (pageNum < totalPages) {
          paragraphs.push(new Paragraph({ text: "" })); // spacer
        }
      }

      // Create a new Word Document
      const doc = new DocxDocument({
        sections: [
          {
            properties: {},
            children: paragraphs,
          },
        ],
      });

      // Generate the .docx file
      const blob = await Packer.toBlob(doc);

      return {
        success: true,
        url: URL.createObjectURL(blob),
        message: "PDF converted to Word successfully!",
      };
    } catch (error) {
      console.error("PDF to DOC failed", error);
      return {
        success: false,
        url: "",
        message: "Failed to convert PDF to DOC: " + (error as any).message,
      };
    }
  }

  // PDF to PPT
  if (tool === "PDF to PPT" && !Array.isArray(files)) {
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

      // Set worker
      const version = "5.4.624";
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;

      const arrayBuffer = await files.arrayBuffer();
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
        // ... (continue with rest of logic)
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
            // @ts-ignore - pdfjs-dist type mismatch
            await page.render({ canvasContext: ctx, viewport }).promise;

            // Convert canvas to data URL
            const dataUrl = canvas.toDataURL("image/png");
            console.log(
              `Page ${pageNum} rendered, dataUrl length: ${dataUrl.length}`,
            );

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
      console.log(
        `PPT buffer size: ${(pptData as ArrayBuffer).byteLength} bytes`,
      );

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
  }

  // Word to PDF (Real Formatting via docx-preview with condensed content)
  if (
    (tool === "Word to PDF" || tool === "Convert to PDF") &&
    !Array.isArray(files) &&
    (files.name.endsWith(".docx") || files.name.endsWith(".doc"))
  ) {
    let container: HTMLDivElement | null = null;
    try {
      const arrayBuffer = await files.arrayBuffer();

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
        .docx-wrapper { background: #f0f0f0; padding: 0 !important; }
        .docx-wrapper > section.docx { 
            background: white !important; 
            margin-bottom: 0 !important; 
            box-shadow: none !important;
            /* Remove CSS padding to avoid double margins (we add them in PDF) */
            padding: 0px !important; 
            box-sizing: border-box !important;
            min-height: 1123px;
        }
        /* Condense content slightly to prevent overflow/bleeding. 
           This helps when docx-preview renders slightly larger than Word. */
        .docx * { 
            line-height: 1.05 !important; 
            margin-bottom: 0.1em !important;
        }
        .docx p {
            margin-bottom: 0.3em !important;
        }
      `;
      container.appendChild(style);

      document.body.appendChild(container);

      if (files.name.endsWith(".docx")) {
        await renderAsync(arrayBuffer, container, undefined, {
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          breakPages: true,
          debug: false,
          experimental: true,
          useBase64URL: true,
        });
      } else {
        throw new Error("Legacy .doc format not supported");
      }

      // --- Per-Page Logic ---

      const wrapper = container.querySelector(".docx-wrapper");
      if (!wrapper) throw new Error("Could not find document wrapper");

      // Find all pages rendered by docx-preview
      let pages = Array.from(wrapper.querySelectorAll("section.docx"));

      // Fallback if no sections found
      if (pages.length === 0) {
        if (
          wrapper.children.length > 0 &&
          wrapper.children[0].tagName === "SECTION"
        ) {
          pages = Array.from(wrapper.children as HTMLCollectionOf<HTMLElement>);
        } else {
          pages = [wrapper as HTMLElement];
        }
      }

      const doc = new jsPDF({
        unit: "pt",
        format: "a4",
      });
      const pdfWidth = doc.internal.pageSize.getWidth();
      const pdfHeight = doc.internal.pageSize.getHeight();

      // Define PDF page margins (Standard ~0.7 inch)
      const PDF_MARGIN_TOP = 50;
      const PDF_MARGIN_BOTTOM = 50;
      const PDF_MARGIN_LEFT = 40;
      const PDF_MARGIN_RIGHT = 40;

      // Available content area
      const contentWidth = pdfWidth - PDF_MARGIN_LEFT - PDF_MARGIN_RIGHT;
      const contentHeight = pdfHeight - PDF_MARGIN_TOP - PDF_MARGIN_BOTTOM;

      const html2canvas = (await import("html2canvas")).default;

      for (let i = 0; i < pages.length; i++) {
        const pageEl = pages[i] as HTMLElement;

        if (pageEl.offsetHeight < 10) continue;

        if (i > 0) {
          doc.addPage();
        }

        const canvas = await html2canvas(pageEl, {
          scale: 1.5,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
          windowWidth: 794,
        });

        // Fit to content area width
        const imgWidth = contentWidth;
        const imgHeightInPdf = (canvas.height * contentWidth) / canvas.width;

        // Check if fits in content area
        if (imgHeightInPdf <= contentHeight * 1.25) {
          let finalW = imgWidth;
          let finalH = imgHeightInPdf;

          // Scale down if too tall
          if (finalH > contentHeight) {
            const scaleFactor = contentHeight / finalH;
            finalW = imgWidth * scaleFactor;
            finalH = contentHeight;
          }

          // Center horizontally within margins
          const xOffset = PDF_MARGIN_LEFT + (contentWidth - finalW) / 2;

          const imgData = canvas.toDataURL("image/jpeg", 0.9);
          doc.addImage(
            imgData,
            "JPEG",
            xOffset,
            PDF_MARGIN_TOP,
            finalW,
            finalH,
          );
        } else {
          // SLICING
          const pageHeightInCanvas =
            (contentHeight * canvas.width) / contentWidth;
          const numSlices = Math.ceil(canvas.height / pageHeightInCanvas);

          const tempSliceCanvas = document.createElement("canvas");
          tempSliceCanvas.width = canvas.width;

          const sliceCtx = tempSliceCanvas.getContext("2d")!;

          for (let sliceIndex = 0; sliceIndex < numSlices; sliceIndex++) {
            if (sliceIndex > 0) {
              doc.addPage();
            } else if (i > 0 && sliceIndex === 0) {
              // Already on new page
            }

            const srcY = sliceIndex * pageHeightInCanvas;
            const srcH = Math.min(pageHeightInCanvas, canvas.height - srcY);

            tempSliceCanvas.height = srcH;

            sliceCtx.fillStyle = "#ffffff";
            sliceCtx.fillRect(
              0,
              0,
              tempSliceCanvas.width,
              tempSliceCanvas.height,
            );

            sliceCtx.drawImage(
              canvas,
              0,
              srcY,
              canvas.width,
              srcH,
              0,
              0,
              canvas.width,
              srcH,
            );

            const sliceImgData = tempSliceCanvas.toDataURL("image/jpeg", 0.9);
            const displayedH = (srcH * contentWidth) / canvas.width;

            doc.addImage(
              sliceImgData,
              "JPEG",
              PDF_MARGIN_LEFT,
              PDF_MARGIN_TOP,
              contentWidth,
              displayedH,
            );
          }
        }
      }

      if (container && document.body.contains(container)) {
        document.body.removeChild(container);
      }

      const pdfBlob = doc.output("blob");

      return {
        success: true,
        url: URL.createObjectURL(pdfBlob),
        message: "Word document converted with condensed layout!",
      };
    } catch (error) {
      console.error("Doc convert failed", error);
      if (container && document.body.contains(container)) {
        document.body.removeChild(container);
      }
      return {
        success: false,
        url: "",
        message: "Failed to convert Word document. " + (error as any).message,
      };
    }
  }

  // PowerPoint to PDF (Canvas-based rendering via html2canvas)
  if (
    (tool === "PowerPoint to PDF" || tool === "Convert to PDF") &&
    !Array.isArray(files) &&
    (files.name.endsWith(".pptx") || files.name.endsWith(".ppt"))
  ) {
    // Check for unsupported .ppt format
    if (files.name.endsWith(".ppt") && !files.name.endsWith(".pptx")) {
      return {
        success: false,
        url: "",
        message:
          "Older .PPT format is not supported. Please convert to .PPTX first or use PowerPoint to save as .PPTX format.",
      };
    }
    const { convertPptxToPdf } = await import("./pptToPdf");
    return convertPptxToPdf(files);
  }

  // Excel/Other (Simulated)
  return new Promise((resolve) => {
    setTimeout(async () => {
      // Create a dummy PDF for simulation
      const pdf = await PDFDocument.create();
      const page = pdf.addPage();
      page.drawText(
        `Conversion result for ${Array.isArray(files) ? files[0].name : files.name}`,
        { x: 50, y: 700 },
      );
      page.drawText("Complex formatting requires backend processing.", {
        x: 50,
        y: 650,
      });

      const pdfBytes = await pdf.save();
      const blob = new Blob([pdfBytes as any], { type: "application/pdf" });

      resolve({
        success: true,
        url: URL.createObjectURL(blob),
        message: `${tool} processed successfully! (Basic simulation)`,
      });
    }, 2000);
  });
};
