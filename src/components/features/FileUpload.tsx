"use client";

import React, { useState, useCallback } from "react";
import { UploadCloud, FileType } from "lucide-react";
import { cn } from "@/lib/utils";

export function FileUpload({
  onFileSelect,
  accept = ".pdf",
  multiple = false,
  className,
  fileLabel = "PDF file",
}: {
  onFileSelect: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  className?: string;
  fileLabel?: string;
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const droppedFiles = Array.from(e.dataTransfer.files);

      const acceptedExtensions = accept
        .split(",")
        .map((ext) => ext.trim().toLowerCase());

      const validFiles = droppedFiles.filter((file) => {
        const fileName = file.name.toLowerCase();
        return acceptedExtensions.some((ext) => fileName.endsWith(ext));
      });

      if (validFiles.length > 0) {
        if (!multiple && validFiles.length > 1) {
          onFileSelect([validFiles[0]]);
        } else {
          onFileSelect(validFiles);
        }
      } else {
        alert(`Please upload ${fileLabel}.`);
      }
    },
    [onFileSelect, multiple, accept, fileLabel],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || []);
      if (selectedFiles.length > 0) {
        onFileSelect(selectedFiles);
      }
    },
    [onFileSelect],
  );

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center w-full min-h-[360px] border-2 border-dashed rounded-2xl transition-all duration-400 bg-white/[0.01] backdrop-blur-sm cursor-pointer group",
        isDragOver
          ? "border-blue-500 bg-blue-500/[0.06] shadow-[0_0_40px_rgba(59,130,246,0.15)] scale-[1.01]"
          : "border-slate-700/60 hover:border-slate-500/60 hover:bg-white/[0.02]",
        className,
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => document.getElementById("file-upload")?.click()}
    >
      {/* Animated rings on drag */}
      {isDragOver && (
        <>
          <div className="absolute inset-8 rounded-2xl border border-blue-500/20 animate-pulse" />
          <div className="absolute inset-16 rounded-2xl border border-blue-500/10 animate-pulse animation-delay-200" />
        </>
      )}

      <div className="flex flex-col items-center justify-center gap-5 text-center p-8 relative z-10">
        {/* Icon */}
        <div
          className={cn(
            "p-5 rounded-2xl transition-all duration-300",
            isDragOver
              ? "bg-blue-500/20 scale-110"
              : "bg-gradient-to-br from-blue-500/10 to-violet-500/10 group-hover:from-blue-500/15 group-hover:to-violet-500/15 group-hover:scale-105",
          )}
        >
          <UploadCloud
            className={cn(
              "w-10 h-10 transition-all duration-300",
              isDragOver
                ? "text-blue-400 animate-bounce"
                : "text-slate-400 group-hover:text-blue-400",
            )}
          />
        </div>

        {/* Text */}
        <div className="space-y-1.5">
          <p className="text-xl font-bold text-white">
            {isDragOver ? "Drop to upload" : `Select ${fileLabel}`}
          </p>
          <p className="text-sm text-slate-500">
            or drag and drop your {fileLabel} here
          </p>
        </div>

        {/* File select button */}
        <label htmlFor="file-upload" className="cursor-pointer mt-2">
          <div
            className={cn(
              "inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-all duration-300",
              "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-[1.03]",
              "h-11 px-7",
            )}
          >
            Browse Files
          </div>
        </label>

        {/* Accepted formats */}
        <p className="text-xs text-slate-600 mt-1">
          Accepted: {accept.split(",").map(e => e.trim().replace(".", "").toUpperCase()).join(", ")}
        </p>
      </div>

      <input
        id="file-upload"
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={handleFileInput}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
