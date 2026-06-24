"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";

/**
 * Componente combinado de Select + Input Search
 * Inspirado en la imagen de referencia.
 */
const SelectSearch = ({
  options = [],
  selectedOption,
  onOptionChange,
  searchValue,
  onSearchChange,
  onSearch,
  placeholder = "27-340147741-2",
  className = "",
  width,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const selectRef = useRef(null);
  const dropdownRef = useRef(null);
  const portalRef = useRef(null);

  const handleOptionClick = (option) => {
    if (onOptionChange) onOptionChange(option);
    setIsOpen(false);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        (!portalRef.current || !portalRef.current.contains(event.target))
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScrollOrResize = () => {
      setIsOpen(false);
    };
    if (isOpen) {
      window.addEventListener("scroll", handleScrollOrResize, true);
      window.addEventListener("resize", handleScrollOrResize);
    }
    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && selectRef.current) {
      const rect = selectRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [isOpen]);

  const currentOption = selectedOption || options[0];
  const hasSearch = !!(onSearchChange || onSearch || searchValue !== undefined);

  return (
    <div
      ref={selectRef}
      className={`relative flex items-center bg-white dark:bg-content1 border border-gray-300 dark:border-divider rounded-full h-[40px] ${isOpen ? "z-50" : "z-10"} ${className}`}
      style={width ? { width } : undefined}
    >
      {/* Sector del Select */}
      <div
        ref={dropdownRef}
        className={`relative flex items-center h-full pl-5 pr-3 cursor-pointer ${hasSearch ? "min-w-[135px]" : "w-full"}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-[var(--font-size-caption)] text-gray-700 dark:text-foreground/80 font-medium flex-1 mr-3 whitespace-nowrap overflow-hidden text-ellipsis">
          {currentOption?.selectedLabel || currentOption?.label}
        </span>
        <FontAwesomeIcon
          icon={faChevronDown}
          className="text-black dark:text-foreground transition-transform duration-300"
          size="sm"
          style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
        />

        {/* Menú Desplegable con Portal */}
        {isOpen && mounted && createPortal(
          <div
            ref={portalRef}
            style={{
              position: "absolute",
              top: `${coords.top + 6}px`,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
            }}
            className="bg-white dark:bg-content1 border border-gray-200 dark:border-divider rounded-xl shadow-lg z-[9999] py-1 max-h-60 overflow-y-auto animate-in fade-in zoom-in duration-200"
          >
            {options.map((opt, index) => (
              <div
                key={index}
                className="px-4 py-2.5 text-[var(--font-size-caption)] text-gray-700 dark:text-foreground/80 hover:bg-[var(--color-primary-light)] cursor-pointer whitespace-nowrap"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOptionClick(opt);
                }}
              >
                {opt.label}
              </div>
            ))}
          </div>,
          document.body
        )}
      </div>

      {hasSearch && (
        <>
          {/* Divisor Vertical */}
          <div className="w-[1px] h-5 bg-gray-300 dark:bg-divider"></div>

          {/* Sector del Input de Búsqueda */}
          <input
            type="text"
            className="flex-1 h-full px-4 text-[var(--font-size-caption)] text-gray-700 dark:text-foreground/80 bg-transparent outline-none placeholder:text-gray-300 dark:placeholder:text-foreground/30"
            placeholder={placeholder}
            value={searchValue}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && onSearch) onSearch();
            }}
          />

          {/* Ícono de Búsqueda */}
          <button
            type="button"
            className="pr-5 pl-2 h-full flex items-center justify-center text-[var(--color-primary)] hover:text-blue-800 transition-colors focus:outline-none"
            onClick={() => onSearch && onSearch()}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M19.6328 17.8672L14.6875 12.918C15.668 11.5742 16.25 9.91797 16.25 8.125C16.25 3.63672 12.6133 0 8.125 0C3.63672 0 0 3.63672 0 8.125C0 12.6133 3.63672 16.25 8.125 16.25C9.91797 16.25 11.5742 15.6719 12.918 14.6875L17.8672 19.6328C18.3555 20.1211 19.1484 20.1211 19.6367 19.6328C20.125 19.1445 20.125 18.3516 19.6367 17.8633L19.6328 17.8672ZM8.125 13.75C5.02344 13.75 2.5 11.2266 2.5 8.125C2.5 5.02344 5.02344 2.5 8.125 2.5C11.2266 2.5 13.75 5.02344 13.75 8.125C13.75 11.2266 11.2266 13.75 8.125 13.75Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </>
      )}
    </div>
  );
};

export default SelectSearch;
