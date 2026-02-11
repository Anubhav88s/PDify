import { compressImageHelper } from "./common";

export const compressImage = async (
  file: File,
  compressionLevel?: "extreme" | "recommended" | "less",
): Promise<{ success: boolean; url: string; message: string }> => {
  try {
    const buffer = await file.arrayBuffer();
    const compressedBuffer = await compressImageHelper(
      buffer,
      file.type,
      compressionLevel,
    );
    const blob = new Blob([compressedBuffer], { type: file.type });
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
};
