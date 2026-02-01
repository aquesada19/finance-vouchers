"use client";

import { useEffect, useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import MonthPicker from "@/components/MonthPicker";
import Spinner from "@/components/Spinner";
import Select from "@/components/Select";

interface Category { id: string; name: string }
interface Budget { id: string; amount: number; currency: string; category: Category; categoryId: string; month: string }
interface Rule { id: string; name: string; pattern: string; priority: number; category: Category; categoryId: string }

export default function BudgetsPage() {
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

    const queryClient = useQueryClient();

    const { data: categoriesRes, isLoading: categoriesLoading } = useQuery<any, Error>({ queryKey: ['categories'], queryFn: () => fetch('/api/categories').then((r) => r.json()) });
    const { data: budgetsRes, isLoading: budgetsLoading } = useQuery<any, Error>({ queryKey: ['budgets', month], queryFn: () => fetch(`/api/budgets?month=${month}`).then((r) => r.json()) });
    const { data: rulesRes, isLoading: rulesLoading } = useQuery<any, Error>({ queryKey: ['merchant-rules'], queryFn: () => fetch('/api/merchant-rules').then((r) => r.json()) });

    const categories = categoriesRes?.categories ?? [];
    const budgets = budgetsRes?.budgets ?? [];
    const rules = rulesRes?.rules ?? [];

    const [newCat, setNewCat] = useState("");
    const [ruleName, setRuleName] = useState("");
    const [rulePattern, setRulePattern] = useState("");
    const [ruleCategoryId, setRuleCategoryId] = useState("");
    const [rulePriority, setRulePriority] = useState(100);

    const [savingMap, setSavingMap] = useState<Record<string, boolean>>({});

    // Mutations
    const createCategoryMutation = useMutation<void, Error, string>({
        mutationFn: (name: string) => fetch('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) }).then((r) => r.json()),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] })
    });

    const createRuleMutation = useMutation<void, Error, { name: string; pattern: string; categoryId: string; priority: number }>({
        mutationFn: (payload) => fetch('/api/merchant-rules', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).then((r) => r.json()),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['merchant-rules'] })
    });

    const upsertBudgetMutation = useMutation<any, Error, { categoryId: string; amount: number }>({
        mutationFn: (payload) => fetch('/api/budgets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ categoryId: payload.categoryId, month, amount: payload.amount, currency: 'CRC' }) }).then((r) => r.json()),
        onMutate: async (vars) => {
            setSavingMap((s) => ({ ...s, [vars.categoryId]: true }));
        },
        onSettled: (_data, _error, vars) => {
            setSavingMap((s) => {
                const n = { ...s };
                if (vars?.categoryId) delete n[vars.categoryId];
                return n;
            });
            queryClient.invalidateQueries({ queryKey: ['budgets', month] });
        }
    });

    async function createCategory() {
        if (!newCat.trim()) return;
        await createCategoryMutation.mutateAsync(newCat);
        setNewCat("");
    }

    async function upsertBudget(categoryId: string, amount: number) {
        if (isNaN(amount)) return;
        // avoid unnecessary writes if unchanged
        const existing = budgets.find((b: Budget) => b.categoryId === categoryId);
        if (existing && existing.amount === amount) return;

        upsertBudgetMutation.mutate({ categoryId, amount });
    }

    // timers for debounced auto-save per category
    const saveTimers = useRef<Record<string, number>>({});

    function scheduleSave(categoryId: string, value: string) {
        if (value.trim() === "") return;
        const num = Number(value);
        if (isNaN(num)) return;
        // clear existing timer
        const existing = saveTimers.current[categoryId];
        if (existing) clearTimeout(existing);
        // schedule save after 1s of inactivity
        const t = window.setTimeout(async () => {
            await upsertBudget(categoryId, num);
            saveTimers.current[categoryId] = 0;
        }, 1000);
        saveTimers.current[categoryId] = t;
    }

    function flushSave(categoryId: string, value: string) {
        const existing = saveTimers.current[categoryId];
        if (existing) {
            clearTimeout(existing);
            saveTimers.current[categoryId] = 0;
        }
        if (value.trim() === "") return;
        const num = Number(value);
        if (isNaN(num)) return;
        upsertBudget(categoryId, num);
    }

    // cleanup timers on unmount
    useEffect(() => {
        return () => {
            Object.values(saveTimers.current).forEach((t) => { if (t) clearTimeout(t); });
        };
    }, []);

    async function createRule() {
        if (!ruleName || !rulePattern || !ruleCategoryId) return;
        await createRuleMutation.mutateAsync({ name: ruleName, pattern: rulePattern, categoryId: ruleCategoryId, priority: rulePriority });
        setRuleName(""); setRulePattern(""); setRuleCategoryId(""); setRulePriority(100);
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-xl font-semibold">Presupuestos</h1>
                    <p className="text-sm text-slate-700">Definí tus presupuestos mensuales y reglas de categorización.</p>
                </div>
                <MonthPicker value={month} onChange={setMonth} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border bg-white p-4">
                    <div className="text-sm font-semibold text-slate-700">Categorías</div>
                    <div className="mt-3 flex gap-2">
                        <input value={newCat} onChange={(e) => setNewCat(e.target.value)} className="w-full rounded-xl border px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500" placeholder="Nueva categoría (ej: Transporte)" />
                        <button onClick={createCategory} disabled={createCategoryMutation.status === 'pending'} className={`rounded-xl px-4 py-2 text-sm text-white ${createCategoryMutation.status === 'pending' ? 'bg-gray-400 pointer-events-none' : 'bg-black'}`}>
                            {createCategoryMutation.status === 'pending' ? (<span className="flex items-center gap-2"><Spinner /> Creando…</span>) : 'Agregar'}
                        </button>
                    </div>
                    <div className="mt-4 space-y-2">
                        {categoriesLoading ? (
                            <div className="mt-2 flex items-center gap-2 text-sm text-slate-600"><Spinner /> Cargando categorías…</div>
                        ) : categories.length === 0 ? (
                            <div className="text-sm text-slate-700">Aún no hay categorías.</div>
                        ) : (
                            categories.map((c: Category) => (
                                <div key={c.id} className="flex items-center justify-between rounded-xl border p-3">
                                    <div className="text-sm font-medium text-slate-700">{c.name}</div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            className="w-28 rounded-xl border px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500"
                                            placeholder="Presupuesto"
                                            onChange={(e) => scheduleSave(c.id, (e.target as HTMLInputElement).value)}
                                            onBlur={(e) => flushSave(c.id, (e.target as HTMLInputElement).value)}
                                        />
                                        {savingMap[c.id] && <Spinner />}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="rounded-2xl border bg-white p-4">
                    <div className="text-sm font-semibold text-slate-700">Presupuestos del mes</div>
                    <div className="mt-4 space-y-2">
                        {budgets.map((b: Budget) => (
                            <div key={b.id} className="flex items-center justify-between rounded-xl border p-3">
                                <div className="text-sm text-slate-700">{b.category.name}</div>
                                <div className="text-sm font-semibold text-slate-900">CRC {b.amount.toLocaleString()}</div>
                            </div>
                        ))}
                        {budgetsLoading ? (
                            <div className="mt-2 flex items-center gap-2 text-sm text-slate-600"><Spinner /> Cargando presupuestos…</div>
                        ) : budgets.length === 0 ? (
                            <div className="text-sm text-slate-700">Aún no hay presupuestos.</div>
                        ) : null}
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border bg-white p-4">
                <div className="text-sm font-semibold text-slate-700">Reglas de comercio (regex)</div>
                <p className="mt-1 text-sm text-slate-700">
                    Ejemplos: <code className="text-xs">\\bUBER\\b|UBER RIDES</code>, <code className="text-xs">WALMART|AUTOMERCADO</code>
                </p>

                <div className="mt-4 grid gap-2 md:grid-cols-4">
                    <input value={ruleName} onChange={(e) => setRuleName(e.target.value)} className="rounded-xl border px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500" placeholder="Nombre" />
                    <input value={rulePattern} onChange={(e) => setRulePattern(e.target.value)} className="rounded-xl border px-3 py-2 text-sm text-slate-900 md:col-span-2 placeholder:text-slate-500" placeholder="Patrón (regex)" />
                    <input value={String(rulePriority)} onChange={(e) => setRulePriority(Number(e.target.value))} className="rounded-xl border px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500" type="number" placeholder="Prioridad" />
                    <div className="w-full">
                        <Select
                            value={ruleCategoryId}
                            onChange={setRuleCategoryId}
                            placeholder="Categoría"
                            options={[...categories.map((c: Category) => ({ value: c.id, label: c.name }))]}
                        />
                    </div>
                    <button onClick={createRule} disabled={createRuleMutation.status === 'pending'} className={`rounded-xl px-4 py-2 text-sm text-white md:col-span-1 ${createRuleMutation.status === 'pending' ? 'bg-gray-400 pointer-events-none' : 'bg-black'}`}>
                        {createRuleMutation.status === 'pending' ? (<span className="flex items-center gap-2"><Spinner /> Creando…</span>) : 'Agregar regla'}
                    </button>
                </div>

                <div className="mt-4 space-y-2">
                    {rules.map((r: Rule) => (
                        <div key={r.id} className="rounded-xl border p-3">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="text-sm font-medium text-slate-900">{r.name}</div>
                                    <div className="mt-1 text-xs text-slate-700">
                                        <span className="mr-3">Prioridad <span className="font-medium text-slate-700">{r.priority}</span></span>
                                        <span className="text-slate-700">Categoría: <span className="font-medium">{r.category.name}</span></span>
                                    </div>
                                </div>
                                <div className="ml-4 text-xs text-slate-700 bg-slate-50 px-2 py-1 rounded">{r.category.name}</div>
                            </div>
                            <pre className="mt-2 overflow-x-auto rounded bg-slate-50 p-2 text-xs text-slate-700 font-mono">{r.pattern}</pre>
                        </div>
                    ))}
                    {rulesLoading ? (
                        <div className="mt-2 flex items-center gap-2 text-sm text-slate-600"><Spinner /> Cargando reglas…</div>
                    ) : rules.length === 0 ? (
                        <div className="text-sm text-slate-700">Aún no hay reglas.</div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
