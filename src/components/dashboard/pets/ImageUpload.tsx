'use client';

import { useRef, useState } from 'react';

interface ImageUploadProps {
  value?: string | null;
  onChange: (dataUrl: string | null) => void;
}

export default function ImageUpload({ value, onChange }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFile = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      onChange(result);
    };
    reader.readAsDataURL(file);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    handleFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  };

  return (
    <div className="space-y-2">
      <div
        className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-colors ${isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
        onClick={() => inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" accept="image/*" onChange={handleInput} className="hidden" />
        <div className="flex items-center justify-center flex-col">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-2 overflow-hidden">
            {value ? (
              // Direct data URL img preview
              <img src={value} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            )}
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-900">Pet Photo</h4>
            <p className="text-xs text-gray-500">Click or drag to upload a photo (JPG/PNG)</p>
          </div>
        </div>
      </div>

      {value && (
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => onChange(null)} className="text-sm text-red-600 hover:text-red-800">Remove photo</button>
        </div>
      )}
    </div>
  );
}
