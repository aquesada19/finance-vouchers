"use client";

import React, { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

function Item({ href, label, onClick }: { href: string; label: string; onClick?: () => void }) {
    const pathname = usePathname();
    const active = pathname === href;
    return (
        <Link
            href={href}
            onClick={onClick}
            className={`whitespace-nowrap rounded-lg px-2 py-1 text-sm ${active ? "bg-slate-800 text-white" : "text-slate-700 hover:bg-white"}`}
        >
            {label}
        </Link>
    );
}

export default function Nav() {
    const [open, setOpen] = useState(false);
    const menuRef = React.useRef<HTMLDivElement | null>(null);
    const buttonRef = React.useRef<HTMLButtonElement | null>(null);

    React.useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (!open) return;
            const target = e.target as Node;
            if (menuRef.current && !menuRef.current.contains(target) && buttonRef.current && !buttonRef.current.contains(target)) {
                setOpen(false);
            }
        }

        function handleKey(e: KeyboardEvent) {
            if (e.key === 'Escape') setOpen(false);
        }

        document.addEventListener('mousedown', handleClick);
        document.addEventListener('keydown', handleKey);
        return () => {
            document.removeEventListener('mousedown', handleClick);
            document.removeEventListener('keydown', handleKey);
        };
    }, [open]);

    return (
        <header className="sticky top-0 z-10 border-b bg-gray-50/90 backdrop-blur" style={{ position: 'relative' }}>
            <div className="mx-auto flex max-w-5xl items-center justify-between p-3 md:p-6">
                <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-slate-800 px-2 py-1 text-white text-xs font-semibold">FV</div>
                    <span className="hidden sm:inline-block text-sm font-semibold text-slate-900">Vales Financieros</span>
                </div>

                {/* desktop nav */}
                <nav className="hidden md:flex items-center gap-2">
                    <Item href="/" label="Inicio" />
                    <Item href="/budgets" label="Presupuestos" />
                    <Item href="/compare" label="Comparar" />
                    <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="rounded-lg px-2 py-1 text-sm text-slate-700 hover:bg-white"
                    >
                        Cerrar sesión
                    </button>
                </nav>

                {/* mobile menu button */}
                <div className="md:hidden flex items-center">
                    <button
                        aria-label="Alternar menú"
                        ref={buttonRef}
                        onClick={() => setOpen((s) => !s)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/70 text-slate-700 shadow"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 7H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M4 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* mobile dropdown */}
            <div className={`md:hidden absolute inset-x-4 top-full mt-2 z-20 flex justify-end ${open ? '' : 'pointer-events-none'}`}>
                <div
                    ref={menuRef}
                    className={`transform transition-all duration-200 ease-out origin-top-right w-full max-w-xs rounded-lg bg-white border border-gray-100 p-3 shadow-lg ring-1 ring-black/5 ${open ? 'opacity-100 scale-100 visible pointer-events-auto' : 'opacity-0 scale-95 invisible pointer-events-none'}`}
                >
                    <div className="flex flex-col gap-2">
                        <Item href="/" label="Inicio" onClick={() => setOpen(false)} />
                        <Item href="/budgets" label="Presupuestos" onClick={() => setOpen(false)} />
                        <Item href="/compare" label="Comparar" onClick={() => setOpen(false)} />
                        <button
                            onClick={() => signOut({ callbackUrl: "/login" })}
                            className="mt-1 rounded-lg px-2 py-2 text-left text-sm text-slate-700 hover:bg-gray-50"
                        >
                            Cerrar sesión
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}
