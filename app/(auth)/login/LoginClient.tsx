"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import Spinner from "@/components/Spinner";

export default function LoginClient() {
    const [signingIn, setSigningIn] = useState(false);

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-indigo-100">
            <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-xl flex flex-col items-center">
                <h1 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">Vales Financieros</h1>
                <p className="mb-6 text-base text-slate-700 text-center">Iniciá sesión con Google para leer tus vouchers de Gmail.</p>
                <button
                    onClick={async () => { setSigningIn(true); await signIn("google", { callbackUrl: "/" }); setSigningIn(false); }}
                    disabled={signingIn}
                    className={`mt-2 w-full flex items-center justify-center gap-3 rounded-xl px-4 py-3 font-semibold text-base transition-all duration-150 shadow-sm border border-slate-200 ${signingIn ? 'bg-gray-200 text-slate-400 pointer-events-none' : 'bg-white hover:bg-indigo-50 text-slate-900'}`}
                >
                    {signingIn ? (
                        <span className="flex items-center gap-2 justify-center"><Spinner /> Continuando…</span>
                    ) : (
                        <>
                            <span className="inline-block w-6 h-6">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><g><path fill="#4285F4" d="M24 9.5c3.54 0 6.72 1.22 9.22 3.22l6.9-6.9C36.16 2.34 30.47 0 24 0 14.61 0 6.27 5.7 2.22 14.1l8.06 6.27C12.7 13.7 17.89 9.5 24 9.5z"/><path fill="#34A853" d="M46.1 24.5c0-1.54-.14-3.02-.41-4.45H24v8.44h12.44c-.54 2.9-2.18 5.36-4.64 7.02l7.18 5.59C43.73 37.16 46.1 31.3 46.1 24.5z"/><path fill="#FBBC05" d="M10.28 28.37c-.62-1.86-.98-3.83-.98-5.87s.36-4.01.98-5.87l-8.06-6.27C.8 13.61 0 18.64 0 24c0 5.36.8 10.39 2.22 14.1l8.06-6.27z"/><path fill="#EA4335" d="M24 48c6.47 0 12.16-2.14 16.62-5.84l-7.18-5.59c-2.01 1.35-4.59 2.15-7.44 2.15-6.11 0-11.3-4.2-13.72-10.1l-8.06 6.27C6.27 42.3 14.61 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></g></svg>
                            </span>
                            <span>Continuar con Google</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
