"use client";

import * as React from "react";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

const ToastContext = React.createContext<{
  toasts: Toast[];
  addToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}>({
  toasts: [],
  addToast: () => {},
  removeToast: () => {},
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substring(7);
    const newToast = { id, message, type };
    setToasts((prev) => [...prev, newToast]);

    // Auto remove after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

function ToastContainer({
  toasts,
  removeToast,
}: {
  toasts: Toast[];
  removeToast: (id: string) => void;
}) {
  return (
    <div className="fixed bottom-20 left-0 right-0 z-50 flex flex-col items-center gap-2 p-4 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const icons = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info,
  };

  const colors = {
    success: "bg-green-500/10 border-green-500/20 text-green-500",
    error: "bg-red-500/10 border-red-500/20 text-red-500",
    info: "bg-blue-500/10 border-blue-500/20 text-blue-500",
  };

  const Icon = icons[toast.type];

  return (
    <div
      className={cn(
        "pointer-events-auto flex items-center gap-3 rounded-lg border p-3 shadow-lg backdrop-blur-sm animate-in slide-in-from-bottom-2",
        colors[toast.type]
      )}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      <p className="text-sm font-medium flex-1">{toast.message}</p>
      <button
        onClick={onClose}
        className="rounded-sm opacity-70 hover:opacity-100 transition-opacity"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

