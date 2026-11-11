"use client";

import { Label, ListBox, Select } from "@heroui/react";

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
  const selected = options.some((option) => option.value === value) ? value : null;
  return (
    <Select
      aria-label={ariaLabel || label || placeholder}
      placeholder={placeholder}
      value={selected}
      onChange={(key) => {
        if (key != null && key !== value) onChange?.(key);
      }}
      isDisabled={disabled}
      className={className}
    >
      {label && <Label className="text-xs text-default-500">{label}</Label>}
      <Select.Trigger className={compact ? "min-h-7 bg-transparent px-2 text-xs" : "min-h-10 bg-content2 px-3"}>
        <Select.Value className="min-w-0 flex-1 truncate font-medium" />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover placement="bottom start" offset={6} className="rounded-[10px] bg-content1">
        <ListBox>
          {options.map((option) => (
            <ListBox.Item key={option.value} id={option.value} textValue={option.label}>
              {option.label}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}
