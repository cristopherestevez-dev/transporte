// components/ModalWrapper.jsx
import React from "react";

export default function ModalWrapper({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <>
      {/* Fondo oscuro */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
          <header className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Cerrar modal"
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold leading-none"
            >
              &times;
            </button>
          </header>
          <div>{children}</div>
        </div>
      </div>
    </>
  );
}
