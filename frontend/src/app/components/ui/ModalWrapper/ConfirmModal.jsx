"use client";
import React from "react";
import { HiOutlineX } from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  label,
  bgcolor,
  bghover,
}) {
  const hoverClasses = {
    red: "hover:bg-red-700",
    blue: "hover:bg-blue-700",
    green: "hover:bg-green-700",
    yellow: "hover:bg-yellow-700",
  };
  const hoverClass = hoverClasses[bghover] || "";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="relative w-full max-w-md bg-content1 rounded-2xl shadow-xl border border-divider p-6 z-10 m-4"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-default-400 hover:text-foreground transition-colors"
            >
              <HiOutlineX size={20} />
            </button>

            <h2 className="text-xl font-bold mb-2 text-foreground">{title}</h2>
            <p className="text-default-500 mb-8">{message}</p>

            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-default-600 bg-default-100 hover:bg-default-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={onConfirm}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg shadow-md transition-transform active:scale-95 ${bgcolor} ${hoverClass}`}
              >
                {label}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
