"use client";
import { createContext, useContext, useState, useCallback } from "react";
import {
  HiCheckCircle,
  HiXCircle,
  HiExclamation,
  HiInformationCircle,
  HiX,
} from "react-icons/hi";

const ToastContext = createContext(null);

const icons = {
  success: <HiCheckCircle className="w-5 h-5 text-green-500" />,
  error: <HiXCircle className="w-5 h-5 text-red-500" />,
  warning: <HiExclamation className="w-5 h-5 text-yellow-500" />,
  info: <HiInformationCircle className="w-5 h-5 text-blue-500" />,
};

const bgColors = {
  success:
    "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800",
  error: "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800",
  warning:
    "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800",
  info: "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800",
};

function Toast({ id, message, type = "info", onClose }) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg animate-slide-in ${bgColors[type]}`}
      role="alert"
    >
      {icons[type]}
      <span className="flex-1 text-sm font-medium text-foreground">
        {message}
      </span>
      <button
        onClick={() => onClose(id)}
        className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
      >
        <HiX className="w-4 h-4 text-foreground/60" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info", duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const toast = {
    success: (message, duration) => addToast(message, "success", duration),
    error: (message, duration) => addToast(message, "error", duration),
    warning: (message, duration) => addToast(message, "warning", duration),
    info: (message, duration) => addToast(message, "info", duration),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => (
          <Toast key={t.id} {...t} onClose={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export default ToastProvider;
