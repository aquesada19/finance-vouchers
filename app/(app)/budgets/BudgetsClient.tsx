"use client";

import { useEffect, useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import MonthPicker from "@/components/MonthPicker";
import Spinner from "@/components/Spinner";
import Select from "@/components/Select";
import TagInput from "@/components/TagInput";

interface Category { id: string; name: string }
interface Budget { id: string; amount: number; currency: string; category: Category; categoryId: string; month: string }
interface Rule { id: string; name: string; pattern: string; category: Category; categoryId: string }

export default function BudgetsClient() {
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
    const [ruleTags, setRuleTags] = useState<string[]>([]);
    const [ruleCategoryId, setRuleCategoryId] = useState("");

    const [savingMap, setSavingMap] = useState<Record<string, boolean>>({});

    // Mutations
    const createCategoryMutation = useMutation<void, Error, string>({
        mutationFn: (name: string) => fetch('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) }).then((r) => r.json()),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] })
    });

    const createRuleMutation = useMutation<void, Error, { name: string; pattern: string; categoryId: string }>(
        {mutationFn: (payload) => fetch('/api/merchant-rules', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).then((r) => r.json()),
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

    function tagsToRegex(tags: string[]): string {
        if (!tags.length) return "";
        // Guarda las frases tal cual, separadas por coma
        return tags.map(t => t.trim()).filter(Boolean).join(",");
    }

    // Flag para bloquear doble submit por race entre click y submit
    const ruleSubmitting = useRef(false);
    async function createRule() {
        if (createRuleMutation.status === 'pending' || ruleSubmitting.current) return;
        if (!ruleName || ruleTags.length === 0 || !ruleCategoryId) return;
        ruleSubmitting.current = true;
        const pattern = tagsToRegex(ruleTags);
        try {
            await createRuleMutation.mutateAsync({ name: ruleName, pattern, categoryId: ruleCategoryId });
            setRuleName(""); setRuleCategoryId(""); setRuleTags([]);
        } finally {
            ruleSubmitting.current = false;
        }
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
                                            placeholder="₡"
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
                <div className="text-sm font-semibold text-slate-700">Reglas de comercio</div>
                                <form
                                    className="mt-4 flex flex-col gap-2"
                                    onSubmit={e => {
                                        e.preventDefault();
                                        if (createRuleMutation.status !== 'pending' && !ruleSubmitting.current) createRule();
                                    }}
                                >
                                    <div className="flex flex-col gap-2">
                                        <TagInput
                                            value={ruleTags}
                                            onChange={setRuleTags}
                                            placeholder="Palabras clave (ej: uber, rides, auto mercado)"
                                            disabled={createRuleMutation.status === 'pending'}
                                        />
                                        <div className="text-xs text-slate-500 mt-1">Las palabras/frases se buscarán como coincidencia exacta.</div>
                                    </div>
                                    <div className="flex flex-col md:flex-row gap-2 md:items-end mt-2">
                                        <div className="flex-1 min-w-[120px]">
                                            <input
                                                value={ruleName}
                                                onChange={e => setRuleName(e.target.value)}
                                                className="rounded-xl border px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 w-full"
                                                placeholder="Nombre"
                                                autoComplete="off"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-[120px]">
                                            <Select
                                                value={ruleCategoryId}
                                                onChange={setRuleCategoryId}
                                                placeholder="Categoría"
                                                options={[...categories.map((c: Category) => ({ value: c.id, label: c.name }))]}
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            onClick={createRule}
                                            disabled={createRuleMutation.status === 'pending' || ruleSubmitting.current}
                                            className={`rounded-xl px-4 py-2 text-sm text-white md:ml-2 ${createRuleMutation.status === 'pending' ? 'bg-gray-400 pointer-events-none' : 'bg-black'}`}
                                        >
                                            {createRuleMutation.status === 'pending' ? (
                                                <span className="flex items-center gap-2"><Spinner /> Creando…</span>
                                            ) : 'Agregar regla'}
                                        </button>
                                    </div>
                                </form>

                <div className="mt-4 space-y-2">
                    {rules.map((r: Rule) => (
                        <div key={r.id} className="rounded-xl border p-3">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="text-sm font-medium text-slate-900">{r.name}</div>
                                    <div className="mt-1 text-xs text-slate-700">
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
