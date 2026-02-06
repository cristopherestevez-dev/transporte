import React, { useEffect } from "react";
import { HiOutlineCheckCircle } from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";

export default function SuccessModal({ isOpen, onClose, message }) {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(onClose, 2000); // se cierra automáticamente en 2s
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

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
            className="relative bg-content1 rounded-2xl shadow-xl border border-divider p-8 z-10 m-4 flex flex-col items-center max-w-sm w-full"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              <HiOutlineCheckCircle size={56} className="text-success mb-4" />
            </motion.div>
            <p className="text-center font-semibold text-lg text-foreground">
              {message}
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
