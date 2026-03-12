"use client";

type LoadingOverlayProps = {
  title: string;
  description: string;
};

export default function LoadingOverlay({
  title,
  description,
}: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">
        <div className="mx-auto mb-5 h-14 w-14 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
        <h3 className="mb-2 text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
}
