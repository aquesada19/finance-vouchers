"use client";

export default function Spinner({ size = 4, className = "", sr = "Cargando" }: { size?: number; className?: string; sr?: string }) {
    const px = size * 4;
    return (
        <svg role="img" aria-label={sr} width={px} height={px} viewBox="0 0 24 24" className={`animate-spin inline-block text-slate-700 ${className}`}>
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
        </svg>
    );
}
