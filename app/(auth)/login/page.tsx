"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import Spinner from "@/components/Spinner";

export default function LoginPage() {
    const [signingIn, setSigningIn] = useState(false);

    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="w-full max-w-sm rounded-2xl border bg-white p-6">
                <h1 className="text-xl font-semibold">Vales Financieros</h1>
                <p className="mt-2 text-sm text-slate-700">
                    Iniciá sesión con Google para leer tus vouchers de Gmail.
                </p>
                <button
                    onClick={async () => { setSigningIn(true); await signIn("google", { callbackUrl: "/" }); setSigningIn(false); }}
                    disabled={signingIn}
                    className={`mt-6 w-full rounded-xl px-4 py-3 text-white ${signingIn ? 'bg-gray-400 pointer-events-none' : 'bg-black'}`}
                >
                    {signingIn ? (<span className="flex items-center gap-2 justify-center"><Spinner /> Continuando…</span>) : 'Continuar con Google'}
                </button>
            </div>
        </div>
    );
}
