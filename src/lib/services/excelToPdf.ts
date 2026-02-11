export const excelToPdf = async (
  files: File | File[],
): Promise<{ success: boolean; url: string; message: string }> => {
  // Simulated conversion for Excel/Other
  return new Promise((resolve) => {
    setTimeout(() => {
      // Mock success for simulation
      const blob = new Blob(["Simulated PDF Content from Excel"], {
        type: "application/pdf",
      });
      resolve({
        success: true,
        url: URL.createObjectURL(blob),
        message: "Excel converted to PDF successfully! (Simulation)",
      });
    }, 2000);
  });
};
