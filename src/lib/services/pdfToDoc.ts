import type { Paragraph } from "docx";

export const pdfToDoc = async (
  file: File,
): Promise<{ success: boolean; url: string; message: string }> => {
  if (typeof window === "undefined") {
    return { success: false, url: "", message: "Only supported in browser." };
  }
  try {
    const arrayBuffer = await file.arrayBuffer();
    // @ts-ignore
    const pdfjsLib = await import("pdfjs-dist");

    // FIX: Use unpkg with https and .mjs
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

    // Load the PDF file
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const totalPages = pdf.numPages;

    const { Document, Packer, Paragraph, TextRun, AlignmentType, ImageRun } =
      await import("docx");

    // Extract text pages
    const paragraphs: Paragraph[] = [];

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Coordinate-based text extraction logic remains same...
      const items = textContent.items.filter(
        (item: any) => item.str && item.transform,
      );

      items.sort((a: any, b: any) => {
        const yA = a.transform[5];
        const yB = b.transform[5];
        if (Math.abs(yA - yB) > 5) {
          return yB - yA;
        }
        return a.transform[4] - b.transform[4];
      });

      const viewport = page.getViewport({ scale: 1.0 });
      const pageWidth = viewport.width;

      let currentY = -1;
      let lineItems: any[] = [];

      const processLine = (items: any[]) => {
        if (items.length === 0) return;

        const text = items.map((i) => i.str).join(" ");
        const minX = items[0].transform[4];
        const lastItem = items[items.length - 1];
        const itemWidth = lastItem.width || 0;
        const maxX = lastItem.transform[4] + itemWidth;

        // Explicitly type alignment to allow re-assignment to other enum values
        let alignment: (typeof AlignmentType)[keyof typeof AlignmentType] =
          AlignmentType.LEFT;
        const midPoint = (minX + maxX) / 2;
        const pageMid = pageWidth / 2;

        if (minX > pageMid) {
          if (maxX > pageWidth - 100) {
            alignment = AlignmentType.RIGHT;
          } else {
            if (Math.abs(midPoint - pageMid) < 50) {
              alignment = AlignmentType.CENTER;
            }
          }
        } else {
          if (Math.abs(midPoint - pageMid) < 30) {
            alignment = AlignmentType.CENTER;
          }
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
          processLine(lineItems);
          currentY = y;
          lineItems = [item];
        } else {
          lineItems.push(item);
        }
      });
      processLine(lineItems);

      // Basic image extraction attempt (condensed)
      try {
        const operatorList = await page.getOperatorList();
        // @ts-ignore
        const validImageOps = [
          pdfjsLib.OPS.paintImageXObject,
          pdfjsLib.OPS.paintInlineImageXObject,
        ];

        for (let i = 0; i < operatorList.fnArray.length; i++) {
          if (validImageOps.includes(operatorList.fnArray[i])) {
            const imgName = operatorList.argsArray[i][0];
            try {
              const imgObj = await page.objs.get(imgName);
              if (imgObj && imgObj.width && imgObj.height) {
                const canvas = document.createElement("canvas");
                canvas.width = imgObj.width;
                canvas.height = imgObj.height;
                const ctx = canvas.getContext("2d");
                if (ctx) {
                  if (imgObj.bitmap) ctx.drawImage(imgObj.bitmap, 0, 0);
                  else if (imgObj.data) {
                    const arr = new Uint8ClampedArray(imgObj.data.length);
                    arr.set(imgObj.data);
                    ctx.putImageData(
                      new ImageData(arr, imgObj.width, imgObj.height),
                      0,
                      0,
                    );
                  } else continue;

                  const dataUrl = canvas.toDataURL("image/png");
                  const base64Data = dataUrl.split(",")[1];
                  const imgBuffer = Uint8Array.from(atob(base64Data), (c) =>
                    c.charCodeAt(0),
                  );

                  if (imgBuffer.length > 100) {
                    paragraphs.push(
                      new Paragraph({
                        children: [
                          new ImageRun({
                            data: imgBuffer,
                            transformation: { width: 100, height: 100 }, // Simplified size for now
                            type: "png",
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                      }),
                    );
                  }
                }
              }
            } catch (e) {}
          }
        }
      } catch (e) {}

      if (pageNum < totalPages) {
        paragraphs.push(new Paragraph({ text: "" }));
      }
    }

    const doc = new Document({
      sections: [{ children: paragraphs }],
    });

    const blob = await Packer.toBlob(doc);
    return {
      success: true,
      url: URL.createObjectURL(blob),
      message: "PDF converted to Word successfully!",
    };
  } catch (error) {
    console.error("PDF to Doc failed", error);
    return {
      success: false,
      url: "",
      message: "Failed to convert PDF to Word. " + (error as any).message,
    };
  }
};
