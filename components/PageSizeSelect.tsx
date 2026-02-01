import Select from "@/components/Select";
import React from "react";

interface PageSizeSelectProps {
  value: number;
  onChange: (value: number) => void;
  options?: number[];
}

export default function PageSizeSelect({ value, onChange, options = [10, 20, 50, 100] }: PageSizeSelectProps) {
  return (
    <div className="min-w-[120px]">
      <Select
        value={value}
        onChange={val => onChange(Number(val))}
        options={options.map(n => ({ value: n, label: `${n} por página` }))}
        className="w-full"
      />
    </div>
  );
}
