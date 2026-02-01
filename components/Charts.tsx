"use client";

import { PieChart, Pie, Tooltip, ResponsiveContainer } from "recharts";

export function SpendPie({ spendByCategory }: { spendByCategory: Record<string, number> }) {
    const data = Object.entries(spendByCategory).map(([name, value]) => ({ name, value }));

    return (
        <div className="h-72 w-full rounded-2xl border bg-white p-4">
            <div className="mb-2 text-sm font-semibold">Gasto por categoría</div>
            <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                    <Pie dataKey="value" data={data} outerRadius={90} />
                    <Tooltip />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
