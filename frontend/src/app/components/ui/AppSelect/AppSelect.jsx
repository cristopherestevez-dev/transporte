"use client";

import { Select, SelectItem } from "@heroui/react";
import { ChevronDown } from "lucide-react";
import { useReducedMotion } from "framer-motion";

export default function AppSelect({
  options = [],
  value,
  onChange,
  label,
  ariaLabel,
  placeholder = "Seleccionar…",
  disabled = false,
  compact = false,
  className = "",
}) {
  const reduceMotion = useReducedMotion();
  return (
    <Select
      label={label}
      aria-label={ariaLabel || label || placeholder}
      labelPlacement="outside"
      placeholder={placeholder}
      selectedKeys={options.some((option) => option.value === value) ? [value] : []}
      onSelectionChange={(keys) => {
        const selected = Array.from(keys)[0];
        if (selected !== undefined && selected !== value) onChange?.(selected);
      }}
      disallowEmptySelection
      isDisabled={disabled}
      size={compact ? "sm" : "md"}
      disableAnimation={!!reduceMotion}
      selectorIcon={<ChevronDown size={compact ? 14 : 16} aria-hidden="true" />}
      className={className}
      classNames={{
        label: "text-xs text-default-500",
        trigger: `${compact ? "h-7 min-h-7 pl-2 pr-8 bg-transparent shadow-none data-[hover=true]:bg-content2" : "pl-3 pr-9 min-h-10 bg-content2 shadow-sm data-[hover=true]:bg-default-100"} relative rounded-[10px] border-0 data-[focus-visible=true]:outline-none data-[focus-visible=true]:ring-2 data-[focus-visible=true]:ring-focus/40`,
        innerWrapper: "w-full min-w-0",
        value: compact ? "text-xs font-medium text-default-500" : "text-sm font-medium text-foreground",
        selectorIcon: "absolute right-2.5 left-auto top-1/2 -translate-y-1/2 shrink-0 text-default-500",
        popoverContent: "rounded-[10px] border-0 bg-content1 text-foreground shadow-xl p-1",
        listboxWrapper: "rounded-[10px]",
        listbox: "p-1",
      }}
      popoverProps={{ placement: "bottom-start", offset: 6, triggerScaleOnOpen: false }}
      listboxProps={{
        itemClasses: {
          base: "rounded-[7px] px-3 py-2 text-foreground data-[hover=true]:bg-content2 data-[focus=true]:bg-content2 data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary",
          title: "text-sm font-medium",
          selectedIcon: "text-primary",
        },
      }}
    >
      {options.map((option) => <SelectItem key={option.value} textValue={option.label}>{option.label}</SelectItem>)}
    </Select>
  );
}
