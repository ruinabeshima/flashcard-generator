"use client";

import { FormEvent, useState } from "react";

export default function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Check if file exists
      if (!file) {
        setError("Please select a file");
        return;
      }

      // Validate file type
      const allowedTypes = ["application/pdf"];
      if (!allowedTypes.includes(file.type)) {
        setError("Only PDF files are allowed");
        return;
      }

      // Validate file size
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        setError("File too large (max 10MB)");
        return;
      }

      // Add to form data
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error ?? "Upload failed");
        return;
      }
    } catch (error) {
      console.error(error);
      setError(error instanceof Error ? error.message : "Upload failed");
      return;
    } finally {
      setLoading(false);
    }
  };

  return <h1>File Upload</h1>;
}
