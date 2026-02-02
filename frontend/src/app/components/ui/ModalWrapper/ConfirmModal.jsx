"use client";
import React from "react";
import { HiOutlineX } from "react-icons/hi";

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message,label, bgcolor,bghover }) {
  if (!isOpen) return null;
    const hoverClasses = {
    red: 'hover:bg-red-700',
    blue: 'hover:bg-blue-700',
    green: 'hover:bg-green-700',
    yellow: 'hover:bg-yellow-700',
  };
  const hoverClass = hoverClasses[bghover] || '';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-96 p-6 relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-700">
          <HiOutlineX size={20} />
        </button>
        <h2 className="text-lg font-bold mb-4">{title}</h2>
        <p className="mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition">Cancelar</button>
          <button onClick={onConfirm} className={`px-4 py-2 ${bgcolor} text-white rounded ${hoverClass} transition`}>{label}</button>
        </div>
      </div>
    </div>
  );
}
