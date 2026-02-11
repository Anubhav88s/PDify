// Helper: Convert EMUs to Points (1 inch = 914400 EMUs = 72 pt)
export const emuToPt = (emu: number) => emu / 12700;

// Helper: Convert SVG Blob to PNG ArrayBuffer
export const convertSvgToPng = (
  svgBuffer: ArrayBuffer,
): Promise<ArrayBuffer> => {
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

// Helper: Compress/Resize Image
export const compressImageHelper = (
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
