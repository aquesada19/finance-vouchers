

"use client";
import TransactionsTable from "@/components/TransactionsTable";
import TransactionDetailModal from "@/components/TransactionDetailModal";
import TransactionsFilters from "@/components/TransactionsFilters";
import PageSizeSelect from "@/components/PageSizeSelect";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import MonthPicker from "@/components/MonthPicker";
import Spinner from "@/components/Spinner";
import { SpendPie } from "@/components/Charts";

export default function DashboardPage() {
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
    const [showFilters, setShowFilters] = useState(false);
    const queryClient = useQueryClient();
    const [filters, setFilters] = useState({ merchant: "", minAmount: "", maxAmount: "", categoryId: "", orderBy: "occurredAt", orderDir: "desc" });
    const { data, isLoading: summaryLoading} = useQuery<any, Error>({
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
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['summary', month] });
            queryClient.invalidateQueries({ queryKey: ['transactions', month] });
        }
    });
    async function manualSync() {
        await syncMutation.mutateAsync();
    }

    // Estado para tabla y modal de transacciones (debe estar dentro de la función)
    const [selectedTx, setSelectedTx] = useState<any | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    // Fetch categorías para filtros
    const { data: categoriesRes } = useQuery<any, Error>({ queryKey: ['categories'], queryFn: () => fetch('/api/categories').then((r) => r.json()) });
    const categories = categoriesRes?.categories ?? [];

    // Paginación y query de transacciones
    const [page, setPage] = useState(1);
    const [take, setTake] = useState(20);
    // Construir query string para filtros y paginación
    function buildTxQuery() {
        const params = new URLSearchParams();
        params.set("month", month);
        params.set("take", String(take));
        params.set("skip", String((page - 1) * take));
        if (filters.merchant) params.set("merchant", filters.merchant);
        if (filters.minAmount) params.set("minAmount", filters.minAmount);
        if (filters.maxAmount) params.set("maxAmount", filters.maxAmount);
        if (filters.categoryId) params.set("categoryId", filters.categoryId);
        if (filters.orderBy) params.set("orderBy", filters.orderBy);
        if (filters.orderDir) params.set("orderDir", filters.orderDir);
        return params.toString();
    }
    const { data: txData, isLoading: txLoading } = useQuery<any, Error>({
        queryKey: ['transactions', month, filters, page, take],
        queryFn: () => fetch(`/api/transactions?${buildTxQuery()}`).then((r) => r.json())
    });
    const totalBudget = useMemo(() => {
        if (!data) return 0;
        return Object.values(data.budgetByCategory as Record<string, number>).reduce((a: number, b: number) => a + b, 0);
    }, [data]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
            <main className="mx-auto max-w-6xl md:p-6">
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


                <TransactionsFilters
                    filters={filters}
                    setFilters={setFilters}
                    categories={categories}
                    show={showFilters}
                    setShow={setShowFilters}
                    month={month}
                />


                <div className="mt-6">
                    {data && <SpendPie spendByCategory={data.spendByCategory} />}
                </div>

                <div className="mt-6 rounded-2xl border bg-white p-4">
                    <div className="text-sm font-semibold text-slate-700 mb-2">Transacciones recientes</div>
                    {txLoading ? (
                        <div className="flex items-center gap-2 text-sm text-slate-600"><Spinner /> Cargando transacciones…</div>
                    ) : txData?.transactions?.length ? (
                        <>
                            <TransactionsTable
                                transactions={txData.transactions}
                                onSelect={tx => { setSelectedTx(tx); setModalOpen(true); }}
                            />
                            {/* Paginación */}
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-4 border-t pt-4">
                                <div className="text-xs text-slate-500 mb-2 md:mb-0 text-center md:text-left">Mostrando {((page - 1) * take) + 1} - {Math.min(page * take, txData.total)} de {txData.total}</div>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-2 w-full md:w-auto">
                                    <div className="flex flex-row items-center justify-center gap-2 w-full">
                                        <button
                                            className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-sm font-semibold text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 focus:ring-2 focus:ring-indigo-300 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed w-auto min-w-[90px]"
                                            disabled={page === 1}
                                            aria-label="Anterior"
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                        >
                                            <svg className="w-4 h-4 hidden sm:inline" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                                            <span>Anterior</span>
                                        </button>
                                        <span className="text-xs font-medium text-slate-700 text-center w-full sm:w-auto">Página {page}</span>
                                        <button
                                            className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-sm font-semibold text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 focus:ring-2 focus:ring-indigo-300 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed w-auto min-w-[90px]"
                                            disabled={page * take >= txData.total}
                                            aria-label="Siguiente"
                                            onClick={() => setPage(p => p + 1)}
                                        >
                                            <span>Siguiente</span>
                                            <svg className="w-4 h-4 hidden sm:inline" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                        </button>
                                    </div>
                                    <div className="w-full sm:w-auto">
                                        <PageSizeSelect
                                            value={take}
                                            onChange={n => { setTake(n); setPage(1); }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-sm text-slate-600">No hay transacciones.</div>
                    )}
                </div>

                <TransactionDetailModal
                    open={modalOpen}
                    onClose={() => setModalOpen(false)}
                    transaction={selectedTx}
                />

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
