"use client";
import React, { useEffect } from "react";
import { HiOutlineCheckCircle } from "react-icons/hi";

export default function SuccessModal({ isOpen, onClose, message }) {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(onClose, 2000); // se cierra automáticamente en 2s
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-80 p-6 flex flex-col items-center">
        <HiOutlineCheckCircle size={48} className="text-green-500 mb-4"/>
        <p className="text-center font-medium">{message}</p>
      </div>
    </div>
  );
}
