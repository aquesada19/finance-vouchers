"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import MonthPicker from "@/components/MonthPicker";
import Spinner from "@/components/Spinner";
import { SpendPie } from "@/components/Charts";
import Nav from "@/components/Nav";

type Summary = {
    month: string;
    currency: string;
    total: number;
    spendByCategory: Record<string, number>;
    budgetByCategory: Record<string, number>;
    transactionsCount: number;
};

export default function DashboardPage() {
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

    const queryClient = useQueryClient();

    const { data, isLoading: summaryLoading, isFetching: summaryFetching } = useQuery<any, Error>({
        queryKey: ['summary', month],
        queryFn: () => fetch(`/api/summary?month=${month}`).then((r) => r.json())
    });

    const syncMutation = useMutation<void, Error, void>({
        mutationFn: async () => {
            await fetch("/api/sync/manual", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ month })
            });
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['summary', month] })
    });

    async function manualSync() {
        await syncMutation.mutateAsync();
    }


    const totalBudget = useMemo(() => {
        if (!data) return 0;
        return Object.values(data.budgetByCategory as Record<string, number>).reduce((a: number, b: number) => a + b, 0);
    }, [data]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
            <Nav />
            <main className="mx-auto max-w-6xl p-4 md:p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold">Inicio</h1>
                        <p className="text-sm text-slate-600">Vales importados desde Gmail, categorizados por reglas.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="hidden md:block">
                            <MonthPicker value={month} onChange={setMonth} />
                        </div>
                        <div className="md:hidden">
                            <MonthPicker value={month} onChange={setMonth} />
                        </div>
                        <button
                            onClick={manualSync}
                            disabled={syncMutation.status === 'pending'}
                            className={`rounded-lg px-4 py-2 text-sm text-white ${syncMutation.status === 'pending' ? 'bg-indigo-400 pointer-events-none' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                        >
                            {syncMutation.status === 'pending' ? (<span className="flex items-center gap-2"><Spinner /> Sincronizando…</span>) : 'Sincronizar ahora'}
                        </button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border bg-white p-4">
                        <div className="text-sm text-slate-600">Total gastado</div>
                        <div className="mt-2 text-3xl font-bold text-slate-900">CRC {data?.total?.toLocaleString() ?? "-"}</div>
                        <div className="mt-2 text-sm text-slate-600">Último mes seleccionado: {month}</div>
                    </div>
                    <div className="rounded-2xl border bg-white p-4">
                        <div className="text-sm text-slate-600">Total presupuestos</div>
                        <div className="mt-2 text-3xl font-bold text-slate-900">CRC {totalBudget.toLocaleString()}</div>
                    </div>
                    <div className="rounded-2xl border bg-white p-4">
                        <div className="text-sm text-slate-600">Transacciones</div>
                        <div className="mt-2 text-3xl font-bold text-slate-900">{data?.transactionsCount ?? "-"}</div>
                    </div>
                </div>

                <div className="mt-6">
                    {data && <SpendPie spendByCategory={data.spendByCategory} />}
                </div>

                <div className="mt-6 rounded-2xl border bg-white p-4">
                    <div className="text-sm font-semibold text-slate-700">Presupuestos vs Gasto</div>
                    <div className="mt-4 space-y-3">
                        {data &&
                            Object.keys({ ...data.budgetByCategory, ...data.spendByCategory })
                                .sort()
                                .map((cat) => {
                                    const spend = data.spendByCategory[cat] ?? 0;
                                    const budget = data.budgetByCategory[cat] ?? 0;
                                    const pct = budget > 0 ? Math.min(100, Math.round((spend / budget) * 100)) : 0;

                                    return (
                                        <div key={cat} className="rounded-lg border p-3">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="font-medium">{cat}</span>
                                                <span className="text-slate-700">
                                                    CRC {spend.toLocaleString()} / {budget.toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="mt-2 h-2 w-full rounded-full bg-gray-100">
                                                <div className="h-2 rounded-full bg-indigo-600" style={{ width: `${pct}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                    </div>
                </div>

                {summaryLoading && <div className="mt-4 flex items-center gap-2 text-sm text-slate-600"><Spinner /> Cargando…</div>}
            </main>
        </div>
    );
}
