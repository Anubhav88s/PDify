export const toolsConfig: Record<
  string,
  {
    title: string;
    description: string;
    action: string;
    color: string;
    accept: string;
  }
> = {
  "merge-pdf": {
    title: "Merge PDF",
    description: "Combine multiple PDFs into one unified document.",
    action: "Merge PDF",
    color: "bg-red-600 hover:bg-red-700",
    accept: ".pdf",
  },
  "split-pdf": {
    title: "Split PDF",
    description: "Separate pages from a PDF file.",
    action: "Split PDF",
    color: "bg-green-600 hover:bg-green-700",
    accept: ".pdf",
  },
  "compress-pdf": {
    title: "Compress PDF",
    description: "Reduce the file size of your PDF.",
    action: "Compress PDF",
    color: "bg-blue-600 hover:bg-blue-700",
    accept: ".pdf",
  },
  "jpg-to-pdf": {
    title: "JPG to PDF",
    description: "Convert JPG images to PDF.",
    action: "Convert to PDF",
    color: "bg-yellow-600 hover:bg-yellow-700",
    accept: ".jpg,.jpeg",
  },
  "word-to-pdf": {
    title: "Word to PDF",
    description: "Convert DOC and DOCX to PDF.",
    action: "Convert to PDF",
    color: "bg-blue-800 hover:bg-blue-900",
    accept: ".doc,.docx",
  },
  "powerpoint-to-pdf": {
    title: "PowerPoint to PDF",
    description: "Convert PPT and PPTX to PDF.",
    action: "Convert to PDF",
    color: "bg-orange-700 hover:bg-orange-800",
    accept: ".ppt,.pptx",
  },
  "convert-pdf": {
    title: "Convert to PDF",
    description: "Convert Word, PowerPoint, and Images to PDF.",
    action: "Convert to PDF",
    color: "bg-orange-600 hover:bg-orange-700",
    accept: ".doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png",
  },
  "compress-image": {
    title: "Compress Image",
    description: "Compress JPG, PNG, and SVG images.",
    action: "Compress Image",
    color: "bg-pink-600 hover:bg-pink-700",
    accept: ".jpg,.jpeg,.png,.svg",
  },
  "pdf-to-image": {
    title: "PDF to Image",
    description: "Extract images from PDF or convert pages to JPG.",
    action: "Extract Images",
    color: "bg-yellow-500 hover:bg-yellow-600",
    accept: ".pdf",
  },
  "pdf-to-ppt": {
    title: "PDF to PPT",
    description: "Convert PDF into editable PowerPoint presentations.",
    action: "Convert to PPT",
    color: "bg-orange-800 hover:bg-orange-900",
    accept: ".pdf",
  },
  "pdf-to-doc": {
    title: "PDF to DOC",
    description: "Convert PDF into Word documents.",
    action: "Convert to DOC",
    color: "bg-blue-700 hover:bg-blue-800",
    accept: ".pdf",
  },
};
