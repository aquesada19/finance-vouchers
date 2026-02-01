"use client";

import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell } from "recharts";

export function SpendPie({ spendByCategory }: { spendByCategory: Record<string, number> }) {
    const data = Object.entries(spendByCategory).map(([name, value]) => ({ name, value }));

    // Paleta de colores (puedes expandirla si hay muchas categorías)
    const COLORS = [
        '#6366f1', '#f59e42', '#10b981', '#ef4444', '#fbbf24', '#3b82f6', '#a21caf', '#14b8a6', '#eab308', '#f472b6',
        '#8b5cf6', '#22d3ee', '#f87171', '#84cc16', '#e11d48', '#0ea5e9', '#facc15', '#7c3aed', '#06d6a0', '#ffb703'
    ];
    return (
        <div className="h-72 w-full rounded-2xl border bg-white p-4">
            <div className="mb-2 text-sm font-semibold">Gasto por categoría</div>
            <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                    <Pie dataKey="value" data={data} outerRadius={90}>
                        {data.map((entry, idx) => (
                            <Cell key={`cell-${entry.name}`} fill={COLORS[idx % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
