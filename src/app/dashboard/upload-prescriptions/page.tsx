"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import {
  DocumentTextIcon,
  CloudArrowUpIcon,
  ArrowPathIcon,
  XMarkIcon,
  ClipboardDocumentIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";

export default function UploadPrescriptionPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const MAX_MB = 10;

  const handleFileSelect = (selectedFile: File | undefined) => {
    setError(null);
    setExtractedText(null);
    if (!selectedFile) {
      setFile(null);
      setPreview(null);
      return;
    }
    if (
      !selectedFile.type.startsWith("image/") ||
      !ALLOWED_TYPES.includes(selectedFile.type)
    ) {
      setError(`Please upload an image (${ALLOWED_TYPES.join(", ")})`);
      return;
    }
    if (selectedFile.size > MAX_MB * 1024 * 1024) {
      setError(`File must be under ${MAX_MB}MB`);
      return;
    }
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files[0]);
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleReadPrescription = async () => {
    if (!file) {
      setError("Please select an image first.");
      return;
    }
    setLoading(true);
    setError(null);
    setExtractedText(null);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/prescription/read", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to read prescription");
      }
      setExtractedText(data.text ?? "No text extracted.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!extractedText) return;
    try {
      await navigator.clipboard.writeText(extractedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy to clipboard");
    }
  };

  const clearAll = () => {
    setFile(null);
    setPreview(null);
    setExtractedText(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-indigo-100 rounded-xl">
          <DocumentTextIcon className="w-8 h-8 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Upload Prescription
          </h1>
          <p className="text-gray-600 text-sm">
            Upload a handwritten or printed prescription to extract and view the
            text using AI.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="p-1 rounded hover:bg-red-100"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <CloudArrowUpIcon className="w-5 h-5 text-indigo-500" />
              Prescription image
            </h2>
          </div>
          <div className="p-4">
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_TYPES.join(",")}
              onChange={(e) => handleFileSelect(e.target.files?.[0])}
              className="hidden"
            />
            {!preview ? (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors"
              >
                <CloudArrowUpIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium mb-1">
                  Click or drag an image here
                </p>
                <p className="text-sm text-gray-500">
                  JPG, PNG, WebP, GIF · Max {MAX_MB}MB
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50 aspect-[4/3]">
                  <Image
                    src={preview}
                    alt="Prescription"
                    fill
                    className="object-contain"
                  />
                  <button
                    type="button"
                    onClick={clearAll}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleReadPrescription}
                    disabled={loading}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <ArrowPathIcon className="w-5 h-5 animate-spin" />
                        Reading…
                      </>
                    ) : (
                      <>
                        <DocumentTextIcon className="w-5 h-5" />
                        Read prescription
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50"
                  >
                    Change
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <DocumentTextIcon className="w-5 h-5 text-indigo-500" />
              Extracted text
            </h2>
            {extractedText && (
              <button
                type="button"
                onClick={copyToClipboard}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg"
              >
                {copied ? (
                  <>
                    <CheckIcon className="w-4 h-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <ClipboardDocumentIcon className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
            )}
          </div>
          <div className="p-4 flex-1 min-h-[200px]">
            {extractedText === null && !loading && (
              <p className="text-gray-500 text-sm">
                Upload an image and click “Read prescription” to see the text
                here.
              </p>
            )}
            {loading && (
              <div className="flex items-center gap-2 text-gray-500">
                <ArrowPathIcon className="w-5 h-5 animate-spin" />
                <span>Extracting text…</span>
              </div>
            )}
            {extractedText !== null && !loading && (
              <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans bg-gray-50 rounded-xl p-4 border border-gray-100 overflow-auto max-h-[400px]">
                {extractedText}
              </pre>
            )}
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
        <h3 className="text-sm font-medium text-indigo-900 mb-2">Tips</h3>
        <ul className="text-sm text-indigo-800 space-y-1">
          <li>• Use a clear, well-lit photo of the prescription.</li>
          <li>• Handwritten and printed text are both supported.</li>
          <li>
            • Supported formats: JPG, PNG, WebP, GIF (max {MAX_MB}MB).
          </li>
        </ul>
      </div>
    </div>
  );
}
