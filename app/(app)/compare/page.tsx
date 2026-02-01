"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Spinner from "@/components/Spinner";
import MonthPicker from "@/components/MonthPicker";

type Summary = {
    month: string;
    total: number;
    spendByCategory: Record<string, number>;
};


export default function ComparePage() {
    const now = new Date();
    const m1 = now.toISOString().slice(0, 7);
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 7);

    const [monthA, setMonthA] = useState(m1);
    const [monthB, setMonthB] = useState(prev);

    const { data: a, isLoading: aLoading, isFetching: aFetching } = useQuery<Summary, Error>({
        queryKey: ['summary', monthA],
        queryFn: () => fetch(`/api/summary?month=${monthA}`).then((r) => r.json())
    });

    const { data: b, isLoading: bLoading, isFetching: bFetching } = useQuery<Summary, Error>({
        queryKey: ['summary', monthB],
        queryFn: () => fetch(`/api/summary?month=${monthB}`).then((r) => r.json())
    });

    const loading = aLoading || bLoading; // keep a local derived var for convenience when rendering

    const rows = useMemo(() => {
        if (!a || !b) return [];
        const keys = new Set([...Object.keys(a.spendByCategory), ...Object.keys(b.spendByCategory)]);
        return Array.from(keys).sort().map((k) => {
            const av = a.spendByCategory[k] ?? 0;
            const bv = b.spendByCategory[k] ?? 0;
            return { category: k, a: av, b: bv, diff: av - bv };
        });
    }, [a, b]);

    return (
        <div className="space-y-4 text-slate-900">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-slate-900">Comparar</h1>
                    <p className="text-sm text-slate-700">Comparación mensual por categoría.</p>
                </div>
                <div className="flex items-center gap-2">
                    <MonthPicker value={monthA} onChange={setMonthA} disabled={aLoading || bLoading} />
                    <span className="text-sm text-slate-700">vs</span>
                    <MonthPicker value={monthB} onChange={setMonthB} disabled={aLoading || bLoading} />
                    {(aFetching || bFetching) && <div className="ml-2 text-sm text-slate-600"><Spinner /></div>}

                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border bg-white p-4">
                    <div className="text-sm text-slate-700">{monthA}</div>
                    {aLoading ? (
                        <div className="mt-2 flex items-center gap-2 text-sm text-slate-600"><Spinner /> Cargando…</div>
                    ) : (
                        <div className="mt-2 text-2xl font-semibold text-slate-900">CRC {a?.total?.toLocaleString() ?? "-"}</div>
                    )}
                </div>
                <div className="rounded-2xl border bg-white p-4">
                    <div className="text-sm text-slate-700">{monthB}</div>
                    {bLoading ? (
                        <div className="mt-2 flex items-center gap-2 text-sm text-slate-600"><Spinner /> Cargando…</div>
                    ) : (
                        <div className="mt-2 text-2xl font-semibold text-slate-900">CRC {b?.total?.toLocaleString() ?? "-"}</div>
                    )}
                </div>
            </div>

            <div className="rounded-2xl border bg-white p-4 overflow-x-auto">
                <table className="w-full text-sm text-slate-900">
                    <thead>
                        <tr className="text-left text-slate-700">
                            <th className="py-2">Categoría</th>
                            <th className="py-2">{monthA}</th>
                            <th className="py-2">{monthB}</th>
                            <th className="py-2">Diferencia (A - B)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="py-4">
                                    <div className="flex items-center gap-2 justify-center text-sm text-slate-600"><Spinner /> Cargando…</div>
                                </td>
                            </tr>
                        ) : rows.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="py-4 text-sm text-slate-700">Sin datos.</td>
                            </tr>
                        ) : (
                            rows.map((r) => (
                                <tr key={r.category} className="border-t">
                                    <td className="py-2 font-medium">{r.category}</td>
                                    <td className="py-2">CRC {r.a.toLocaleString()}</td>
                                    <td className="py-2">CRC {r.b.toLocaleString()}</td>
                                    <td className="py-2">{r.diff >= 0 ? "+" : ""}CRC {r.diff.toLocaleString()}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
