"use client";

import { useEffect, useRef, useState, useLayoutEffect } from "react";
import { createPortal } from "react-dom";

export default function Select<T extends { value: string; label: string }>({
    value,
    onChange,
    options,
    disabled = false,
    placeholder,
}: {
    value: string;
    onChange: (v: string) => void;
    options: T[];
    disabled?: boolean;
    placeholder?: string;
}) {
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const btnRef = useRef<HTMLButtonElement | null>(null);
    const popRef = useRef<HTMLDivElement | null>(null);
    const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
    const instanceIdRef = useRef(Math.random().toString(36).slice(2));

    useEffect(() => {
        function onDoc(e: Event) {
            if (!wrapperRef.current) return;
            const target = e.target as Node;
            if (wrapperRef.current.contains(target)) return;
            if (popRef.current && popRef.current.contains(target)) return;
            setOpen(false);
        }
        function onOtherOpen(ev: Event) {
            const detail = (ev as CustomEvent).detail as { id: string } | undefined;
            if (!detail) return;
            if (detail.id !== instanceIdRef.current) setOpen(false);
        }

        document.addEventListener('mousedown', onDoc);
        document.addEventListener('touchstart', onDoc);
        document.addEventListener('monthpicker-open', onOtherOpen as EventListener);
        return () => {
            document.removeEventListener('mousedown', onDoc);
            document.removeEventListener('touchstart', onDoc);
            document.removeEventListener('monthpicker-open', onOtherOpen as EventListener);
        };
    }, []);

    useLayoutEffect(() => {
        function compute() {
            const btn = btnRef.current;
            const pop = popRef.current;
            if (!btn) return;
            const btnRect = btn.getBoundingClientRect();
            const scrollY = window.scrollY || window.pageYOffset;
            const scrollX = window.scrollX || window.pageXOffset;
            const popW = btnRect.width;
            const popH = (pop && pop.offsetHeight) ? pop.offsetHeight : Math.min(300, options.length * 36 + 24);
            const margin = 8;

            let left = btnRect.left + scrollX;
            let top = btnRect.bottom + scrollY;

            // Evitar que el popup se salga de la pantalla
            if (left + popW + margin > window.innerWidth + scrollX) {
                left = Math.max(margin, window.innerWidth + scrollX - popW - margin);
            } else if (left < margin) {
                left = margin;
            }
            if (top + popH + margin > window.innerHeight + scrollY && (btnRect.top - popH - margin) > margin) {
                top = btnRect.top + scrollY - popH - 4;
            }

            setPos({ top, left });
            if (pop) {
                pop.style.width = `${popW}px`;
                pop.style.maxWidth = `${popW}px`;
            }
        }
        if (open) {
            compute();
            setTimeout(() => { if (open) compute(); }, 0);
        }
        const resize = () => { if (open) compute(); };
        window.addEventListener('resize', resize);
        window.addEventListener('scroll', resize, true);
        return () => { window.removeEventListener('resize', resize); window.removeEventListener('scroll', resize, true); };
    }, [open, options.length]);

    const selected = options.find((o) => o.value === value);

    return (
        <div ref={wrapperRef} className="relative inline-block w-full">
            <button
                ref={btnRef}
                type="button"
                disabled={disabled}
                aria-disabled={disabled}
                onPointerDown={(e) => {
                    if (disabled) return;
                    e.preventDefault();
                    const willOpen = !open;
                    setOpen(willOpen);
                    if (willOpen) document.dispatchEvent(new CustomEvent('monthpicker-open', { detail: { id: instanceIdRef.current } }));
                }}
                className={`w-full text-left rounded-xl border bg-white px-3 py-2 pr-8 text-sm text-slate-900 placeholder:text-slate-500 ${disabled ? 'opacity-60 pointer-events-none' : ''}`}
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                <span className={`block truncate ${selected ? 'text-slate-900' : 'text-slate-500'}`}>{selected ? selected.label : (placeholder ?? '')}</span>
                <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>

            {open && pos && createPortal(
                <div
                    ref={popRef}
                    style={{ position: 'absolute', top: `${pos.top}px`, left: `${pos.left}px`, zIndex: 1000, width: undefined }}
                    className="rounded-xl border border-indigo-200 bg-white p-2 shadow-2xl w-auto transition-all duration-150"
                >
                    <div role="listbox" aria-activedescendant={selected?.value} tabIndex={-1} className="max-h-64 overflow-auto">
                        {options.map((o) => (
                            <button key={o.value} type="button" onClick={() => { onChange(o.value); setOpen(false); }} className={`w-full text-left px-3 py-2 text-sm rounded ${o.value === value ? 'bg-indigo-600 text-white' : 'text-slate-800 hover:bg-slate-50'}`}>
                                {o.label}
                            </button>
                        ))}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
