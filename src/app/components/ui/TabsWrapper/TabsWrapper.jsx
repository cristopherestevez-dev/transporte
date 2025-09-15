"use client";
import { useState } from "react";

export default function TabsWrapper({ tabs, initialTab = 0, className = "" }) {
  const [activeIndex, setActiveIndex] = useState(initialTab);

  return (
    <div className={`w-full ${className}`}>
      {/* Botones de pestañas */}
      <div className="flex gap-2 border-b border-gray-300 mb-4">
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => setActiveIndex(index)}
            className={`px-4 py-2 rounded-t-md font-medium transition-colors ${
              activeIndex === index
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido de la pestaña activa */}
      <div className="bg-white shadow-sm rounded-md p-4">
        {tabs[activeIndex].content}
      </div>
    </div>
  );
}

