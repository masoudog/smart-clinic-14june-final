'use client';

interface ToastProps {
  message: string;
}

export default function Toast({ message }: ToastProps) {
  return (
    <div className="fixed bottom-6 left-6 bg-ink text-white px-6 py-3 rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-6 duration-300">
      {message}
    </div>
  );
}
