"use client";

import { useEffect, useState } from 'react';
import { toastStore, Toast as ToastType } from '@/lib/toast-store';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastType[]>([]);

  useEffect(() => {
    return toastStore.subscribe(setToasts);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-3 max-w-md w-full sm:w-auto">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

function Toast({ toast }: { toast: ToastType }) {
  const isError = toast.type === 'error';
  const isSuccess = toast.type === 'success';
  const isInfo = toast.type === 'info';

  const Icon = isSuccess ? CheckCircle2 : isError ? AlertCircle : Info;

  const colorClass = isSuccess 
    ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
    : isError 
      ? 'bg-rose-50 border-rose-200 text-rose-800' 
      : 'bg-blue-50 border-blue-200 text-blue-800';

  const iconColorClass = isSuccess 
    ? 'text-emerald-500' 
    : isError 
      ? 'text-rose-500' 
      : 'text-blue-500';

  return (
    <div 
      className={`flex w-full items-start gap-3 rounded-2xl border p-4 shadow-lg transition-all duration-300 animate-in slide-in-from-right-full ${colorClass}`}
      role="alert"
    >
      <div className={`mt-0.5 shrink-0 ${iconColorClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 text-sm font-medium leading-relaxed">
        {toast.message.split('\n').map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
      <button 
        onClick={() => toastStore.remove(toast.id)}
        className="shrink-0 rounded-lg p-1 transition hover:bg-black/5"
      >
        <X className="h-4 w-4 opacity-60" />
      </button>
    </div>
  );
}
