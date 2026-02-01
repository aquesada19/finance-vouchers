



import { useState, useRef } from "react";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function TagInput({ value, onChange, placeholder, disabled }: TagInputProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function addTag() {
    const clean = input.trim();
    if (!clean || value.includes(clean)) return;
    onChange([...value, clean]);
    setInput("");
    inputRef.current?.focus();
  }

  function removeTag(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          className="flex-1 rounded-xl border px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleInputKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          aria-label="Agregar tag"
        />
        <button
          type="button"
          className="rounded-xl px-3 py-2 text-sm text-white bg-black hover:bg-slate-800 disabled:bg-gray-400"
          onClick={addTag}
          disabled={disabled || !input.trim()}
        >
          Agregar
        </button>
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        {value.map((tag, idx) => (
          <span key={tag + idx} className="flex items-center bg-slate-100 rounded-full px-3 py-1 text-sm font-medium text-slate-700 border border-slate-200">
            <span className="mr-1">{tag}</span>
            <button
              type="button"
              className="ml-1 text-slate-400 hover:text-red-500 focus:outline-none"
              onClick={() => removeTag(idx)}
              disabled={disabled}
              aria-label="Eliminar tag"
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
