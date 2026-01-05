"use client";

import { FormEvent, useRef, useState } from "react";

import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";

export default function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelect = (selected: File | null) => {
    setFile(selected);
    setError(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!file) {
        setError("Please select a file");
        return;
      }

      const allowedTypes = ["application/pdf"];
      if (!allowedTypes.includes(file.type)) {
        setError("Only PDF files are allowed");
        return;
      }

      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        setError("File too large (max 10MB)");
        return;
      }

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

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Upload a PDF</CardTitle>
        <CardDescription>
          Choose a PDF up to 10MB. We&apos;ll handle the upload securely.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
            disabled={loading}
          />

          <div
            className={`relative rounded-lg border-2 border-dashed p-6 transition-colors ${
              isDragging ? "border-primary/60 bg-primary/5" : "border-border"
            }`}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              const droppedFile = event.dataTransfer?.files?.[0] ?? null;
              handleFileSelect(droppedFile);
            }}
            onClick={() => inputRef.current?.click()}
          >
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                PDF only
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Drag and drop your file</p>
                <p className="text-sm text-muted-foreground">
                  or click to browse — up to 10MB
                </p>
              </div>
              <Button type="button" variant="secondary" disabled={loading}>
                Select PDF
              </Button>
            </div>
          </div>

          {file && (
            <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
              <p className="font-medium text-foreground">{file.name}</p>
              <p className="text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" disabled={loading || !file}>
            Upload
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
