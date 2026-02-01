"use client";

import { useEffect, useRef, useState, useLayoutEffect } from "react";
import { createPortal } from "react-dom";

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export default function MonthPicker({ value, onChange, disabled = false }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
    const [open, setOpen] = useState(false);
    const [year, setYear] = useState(() => Number(value.slice(0, 4)) || new Date().getFullYear());
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const popRef = useRef<HTMLDivElement | null>(null);
    const [alignLeft, setAlignLeft] = useState(false);
    const [popPos, setPopPos] = useState<{ top: number; left: number } | null>(null);

    // unique id for this picker instance so we can keep only one open at a time
    const instanceIdRef = useRef<string>(Math.random().toString(36).slice(2));

    useEffect(() => {
        function onDoc(e: Event) {
            if (!wrapperRef.current) return;
            const target = e.target as Node;
            // if click/touch is inside this wrapper OR inside the popover, ignore
            if (wrapperRef.current.contains(target)) return;
            if (popRef.current && popRef.current.contains(target)) return;
            setOpen(false);
        }
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') setOpen(false);
        }

        function onOtherOpen(ev: Event) {
            const detail = (ev as CustomEvent).detail as { id: string } | undefined;
            if (!detail) return;
            if (detail.id !== instanceIdRef.current) setOpen(false);
        }

        document.addEventListener('mousedown', onDoc);
        document.addEventListener('touchstart', onDoc);
        document.addEventListener('keydown', onKey);
        document.addEventListener('monthpicker-open', onOtherOpen as EventListener);
        return () => {
            document.removeEventListener('mousedown', onDoc);
            document.removeEventListener('touchstart', onDoc);
            document.removeEventListener('keydown', onKey);
            document.removeEventListener('monthpicker-open', onOtherOpen as EventListener);
        };
    }, []);

    // compute alignment and absolute position to prevent clipping; store in popPos
    useLayoutEffect(() => {
        function compute() {
            const btn = buttonRef.current;
            const pop = popRef.current;
            if (!btn) return;
            const btnRect = btn.getBoundingClientRect();
            const popW = (pop && pop.offsetWidth) ? pop.offsetWidth : 224; // estimate if not yet mounted
            const popH = (pop && pop.offsetHeight) ? pop.offsetHeight : 200;
            const margin = 8;

            // compute left so pop fits in viewport
            let left = btnRect.left;
            if (left + popW + margin > window.innerWidth) {
                left = Math.max(margin, window.innerWidth - popW - margin);
            } else if (left < margin) {
                left = margin;
            }

            // compute top: prefer below, but if not enough space, place above
            let top = btnRect.bottom + 8;
            if (top + popH + margin > window.innerHeight && (btnRect.top - popH - margin) > margin) {
                top = btnRect.top - popH - 8;
            }

            setAlignLeft(left <= btnRect.left + 1);
            if (pop) pop.style.maxWidth = `calc(100vw - 32px)`;
            setPopPos({ top, left });
        }
        if (open) {
            compute();
            // schedule a re-compute after mount so we can pick up real pop size
            setTimeout(() => { if (open) compute(); }, 0);
        }
        const resize = () => { if (open) compute(); };
        window.addEventListener('resize', resize);
        window.addEventListener('scroll', resize, true);
        return () => { window.removeEventListener('resize', resize); window.removeEventListener('scroll', resize, true); };
    }, [open, year]);

    useEffect(() => {
        // keep year in sync if value prop changes externally
        const y = Number(value.slice(0, 4));
        if (!Number.isNaN(y)) setYear(y);
    }, [value]);

    function selectMonth(mIdx: number) {
        const yy = year;
        const mm = String(mIdx + 1).padStart(2, '0');
        onChange(`${yy}-${mm}`);
        setOpen(false);
    }



    const display = `${value.slice(0, 4)}-${value.slice(5, 7)}`;

    return (
        <div className="relative inline-block" ref={wrapperRef}>
            <button
                type="button"
                ref={buttonRef}
                onPointerDown={(e) => {
                    if (disabled) return;
                    e.preventDefault();
                    const willOpen = !open;
                    setOpen(willOpen);
                    // notify other pickers to close when this opens
                    if (willOpen) document.dispatchEvent(new CustomEvent('monthpicker-open', { detail: { id: instanceIdRef.current } }));
                }}
                disabled={disabled}
                aria-disabled={disabled}
                className={`flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm text-slate-900 sm:focus:outline-none ${disabled ? 'opacity-60 pointer-events-none' : ''}`}
                aria-haspopup="dialog"
                aria-expanded={open}
            >
                <span className="font-medium">{display}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>

            {open && popPos && createPortal(
                <div ref={popRef} style={{ position: 'absolute', top: `${popPos.top}px`, left: `${popPos.left}px`, maxWidth: 'calc(100vw - 32px)' }} className={`rounded-lg border bg-white p-3 z-50`}>
                    <div className="flex items-center justify-between mb-2">
                        <button onClick={() => setYear((y) => y - 1)} className="px-1 py-0.5 rounded text-xs text-slate-600 hover:bg-slate-100">◀</button>
                        <div className="text-base font-semibold text-slate-800">{year}</div>
                        <button onClick={() => setYear((y) => y + 1)} className="px-1 py-0.5 rounded text-xs text-slate-600 hover:bg-slate-100">▶</button>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        {MONTH_NAMES.map((m, idx) => {
                            const isSelected = `${year}-${String(idx + 1).padStart(2, '0')}` === value;
                            return (
                                <button
                                    key={m}
                                    onClick={() => selectMonth(idx)}
                                    className={`rounded-md px-2 py-2 text-sm ${isSelected ? 'bg-indigo-600 text-white' : 'text-slate-800 hover:bg-slate-100'}`}
                                >
                                    {m}
                                </button>
                            );
                        })}
                    </div>

                </div>,
                document.body
            )}
        </div>
    );
}
