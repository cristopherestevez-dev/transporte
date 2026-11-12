"use client";

import { ChevronDown, Filter } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import Button from "@/app/components/ui/Button/button";

const fieldClass = "w-full min-w-0 rounded-[10px] border border-divider bg-content1 px-3 py-2 text-foreground";

export default function ColumnFilters({ fields, values, onChange }) {
  const id = useId();
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const [open, setOpen] = useState(false);
  const activeCount = fields.filter(({ key }) => values[key]?.trim()).length;

  function positionPanel() {
    const trigger = triggerRef.current;
    const panel = panelRef.current;
    if (!trigger || !panel) return;

    const margin = 12;
    const gap = 8;
    const { top, bottom, right } = trigger.getBoundingClientRect();
    const viewportHeight = document.documentElement.clientHeight;
    const viewportWidth = document.documentElement.clientWidth;
    const below = viewportHeight - bottom - gap - margin;
    const above = top - gap - margin;
    const placeAbove = below < 280 && above > below;
    const width = Math.min(416, viewportWidth - margin * 2);

    panel.style.width = width + "px";
    panel.style.left = Math.max(margin, right - width) + "px";
    panel.style.top = placeAbove ? "auto" : bottom + gap + "px";
    panel.style.bottom = placeAbove ? viewportHeight - top + gap + "px" : "auto";
    panel.style.maxHeight = Math.max(0, placeAbove ? above : below) + "px";
  }

  useEffect(() => {
    if (!open) return;
    window.addEventListener("resize", positionPanel);
    window.addEventListener("scroll", positionPanel, true);
    return () => {
      window.removeEventListener("resize", positionPanel);
      window.removeEventListener("scroll", positionPanel, true);
    };
  }, [open]);

  if (!fields.length) return null;

  return (
    <div className="shrink-0">
      <Button
        ref={triggerRef}
        native
        type="button"
        popoverTarget={id}
        aria-expanded={open}
        className="flex h-9 cursor-pointer items-center gap-2 rounded-[10px] border border-divider bg-transparent px-3 text-sm font-medium text-foreground transition-colors hover:bg-content2 focus-visible:outline-2 focus-visible:outline-primary"
      >
        <Filter size={15} aria-hidden="true" />
        Filtros
        {activeCount > 0 && (
          <span className="rounded-full bg-primary px-1.5 text-xs text-primary-foreground" aria-label={activeCount + " filtros activos"}>
            {activeCount}
          </span>
        )}
        <ChevronDown size={14} aria-hidden="true" className={open ? "rotate-180 transition-transform" : "transition-transform"} />
      </Button>

      <div
        ref={panelRef}
        id={id}
        popover="auto"
        onBeforeToggle={(event) => {
          if (event.newState === "open") positionPanel();
        }}
        onToggle={(event) => setOpen(event.newState === "open")}
        className="fixed inset-auto m-0 overflow-hidden rounded-xl border border-divider bg-content1 text-foreground shadow-lg [&:popover-open]:flex [&:popover-open]:flex-col"
      >
        <div className="grid min-h-0 grid-cols-1 gap-3 overflow-y-auto p-4 sm:grid-cols-2">
          {fields.map(({ key, label, type, options }) => {
            const value = values[key] ?? "";
            const update = (next) => onChange({ ...values, [key]: next });

            return (
              <label key={key} className="flex min-w-0 flex-col gap-1 text-sm">
                {label}
                {options ? (
                  <select value={value} onChange={(event) => update(event.target.value)} className={fieldClass.replace("bg-content1", "bg-transparent")}>
                    <option value="">Todos</option>
                    {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                ) : (
                  <input type={type || "search"} value={value} maxLength={100} onChange={(event) => update(event.target.value)} className={fieldClass} />
                )}
              </label>
            );
          })}
        </div>
        <div className="flex shrink-0 justify-end border-t border-divider px-3 py-1">
          <Button native type="button" disabled={!activeCount} onClick={() => onChange({})} className="px-3 py-2 text-sm text-primary disabled:opacity-50">
            Limpiar filtros
          </Button>
        </div>
      </div>
    </div>
  );
}
