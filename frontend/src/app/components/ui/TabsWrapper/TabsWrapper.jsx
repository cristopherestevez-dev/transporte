"use client";
import { useState } from "react";

export default function TabsWrapper({ tabs, initialTab = 0, className = "" }) {
  const [activeIndex, setActiveIndex] = useState(initialTab);

  return (
    <div className={`w-full ${className}`}>
      {/* Botones de pestañas */}
      <div className="flex gap-2 border-b border-divider mb-4">
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => setActiveIndex(index)}
            className={`px-4 py-2 rounded-t-md font-medium transition-colors ${
              activeIndex === index
                ? "bg-brand-navy text-white"
                : "bg-content2 text-foreground hover:bg-content1"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido de la pestaña activa */}
      <div className="bg-content1 shadow-sm rounded-md">
        {tabs[activeIndex].content}
      </div>
    </div>
  );
}
