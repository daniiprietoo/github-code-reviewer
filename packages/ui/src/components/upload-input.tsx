"use client";

import { type InputHTMLAttributes, useCallback } from "react";
import { useDropzone } from "react-dropzone";

export interface UploadFileResponse {
  response: { storageId: string };
}

export interface UploadErrorInfo {
  message: string;
  file?: File;
  error?: Error;
}

function parseAcceptProp(accept: string) {
  const mimeTypes = accept.split(",").map((type) => type.trim());
  const acceptObject: Record<string, string[]> = {};

  for (const mimeType of mimeTypes) {
    acceptObject[mimeType] = [];
  }

  return acceptObject;
}

export function UploadInput({
  generateUploadUrl,
  onUploadComplete,
  onUploadError,
  accept,
  id,
  className,
  required,
  tabIndex,
  ...props
}: {
  generateUploadUrl: () => Promise<string>;
  onUploadComplete: (uploaded: UploadFileResponse[]) => void;
  onUploadError?: (error: UploadErrorInfo) => void;
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

          // Validate storageId exists and is a string
          if (!result?.storageId || typeof result.storageId !== "string") {
            throw new Error("Invalid response: missing or invalid storageId");
          }

          return {
            response: { storageId: result.storageId },
          };
        });

        const uploadedFiles = await Promise.all(uploadPromises);
        onUploadComplete(uploadedFiles);
      } catch (error) {
        console.error("Upload failed:", error);

        // Always call the error handler if provided, so calling components can handle errors
        if (onUploadError) {
          onUploadError({
            message: error instanceof Error ? error.message : "Upload failed",
            error: error instanceof Error ? error : new Error(String(error)),
          });
        }
      }
    },
    [generateUploadUrl, onUploadComplete, onUploadError]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept ? parseAcceptProp(accept) : undefined,
    multiple: false,
  });

  // Check if className contains hiding classes and apply them to wrapper
  const isHidden =
    className?.includes("sr-only") || className?.includes("hidden");

  return (
    <div {...getRootProps()} className={isHidden ? className : undefined}>
      <input
        {...getInputProps()}
        id={id}
        className={isHidden ? undefined : className}
        required={required}
        tabIndex={tabIndex}
        {...props}
      />
    </div>
  );
}
