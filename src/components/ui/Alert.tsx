"use client";

import { ReactNode } from "react";

interface AlertProps {
  type: "success" | "error";
  title?: string;
  message?: string;
  children?: ReactNode;
  className?: string;
  onDismiss?: () => void;
}

export default function Alert({ type, title, message, children, className, onDismiss }: AlertProps) {
  const isSuccess = type === "success";
  
  const bgColor = isSuccess ? "bg-green-50" : "bg-red-50";
  const borderColor = isSuccess ? "border-green-200" : "border-red-200";
  const iconColor = isSuccess ? "text-green-400" : "text-red-400";
  const titleColor = isSuccess ? "text-green-800" : "text-red-800";
  const messageColor = isSuccess ? "text-green-700" : "text-red-700";
  const buttonBg = isSuccess ? "bg-green-50 hover:bg-green-100" : "bg-red-50 hover:bg-red-100";
  const buttonText = isSuccess ? "text-green-800" : "text-red-800";
  const buttonFocus = isSuccess ? "focus-visible:outline-green-600" : "focus-visible:outline-red-600";

  const SuccessIcon = () => (
    <svg viewBox="0 0 20 20" fill="currentColor" data-slot="icon" aria-hidden="true" className="size-5 text-green-400">
      <path d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" fillRule="evenodd" />
    </svg>
  );

  const ErrorIcon = () => (
    <svg viewBox="0 0 20 20" fill="currentColor" data-slot="icon" aria-hidden="true" className="size-5 text-red-400">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
    </svg>
  );

  return (
    <div className={`rounded-md ${bgColor} p-4 border ${borderColor} ${className || ''}`}>
      <div className="flex">
        <div className="shrink-0">
          {isSuccess ? <SuccessIcon /> : <ErrorIcon />}
        </div>
        <div className="ml-3">
          {title && (
            <h3 className={`text-sm font-medium ${titleColor}`}>
              {title}
            </h3>
          )}
          <div className={`${title ? 'mt-2' : ''} text-sm ${messageColor}`}>
            {children || <p>{message}</p>}
          </div>
          {onDismiss && (
            <div className="mt-4">
              <div className="-mx-2 -my-1.5 flex">
                <button 
                  type="button" 
                  onClick={onDismiss}
                  className={`rounded-md ${buttonBg} px-2 py-1.5 text-sm font-medium ${buttonText} focus-visible:outline-2 focus-visible:outline-offset-2 ${buttonFocus}`}
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
