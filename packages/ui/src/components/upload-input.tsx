"use client";

import { type InputHTMLAttributes, useCallback } from "react";
import { useDropzone } from "react-dropzone";

export interface UploadFileResponse {
  response: { storageId: string };
}

export function UploadInput({
  generateUploadUrl,
  onUploadComplete,
  accept,
  id,
  className,
  required,
  tabIndex,
  ...props
}: {
  generateUploadUrl: () => Promise<string>;
  onUploadComplete: (uploaded: UploadFileResponse[]) => void;
} & Pick<
  InputHTMLAttributes<HTMLInputElement>,
  "accept" | "id" | "type" | "className" | "required" | "tabIndex"
>) {
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      try {
        // Upload each file
        const uploadPromises = acceptedFiles.map(async (file) => {
          const uploadUrl = await generateUploadUrl();

          const response = await fetch(uploadUrl, {
            method: "POST",
            body: file,
            headers: {
              "Content-Type": file.type,
            },
          });

          if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
          }

          const result = await response.json();
          return {
            response: { storageId: result.storageId },
          };
        });

        const uploadedFiles = await Promise.all(uploadPromises);
        onUploadComplete(uploadedFiles);
      } catch (error) {
        console.error("Upload failed:", error);
      }
    },
    [generateUploadUrl, onUploadComplete],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept ? { [accept]: [] } : undefined,
    multiple: false,
  });

  return (
    <div {...getRootProps()}>
      <input
        {...getInputProps()}
        id={id}
        className={className}
        required={required}
        tabIndex={tabIndex}
        {...props}
      />
    </div>
  );
}
