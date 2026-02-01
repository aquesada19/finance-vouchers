import React from "react";

interface TransactionRow {
  id: string;
  occurredAt: string;
  merchantRaw?: string;
  merchantNormalized?: string;
  amount: number;
  currency: string;
  category: { id: string; name: string } | null;
}

interface TransactionsTableProps {
  transactions: TransactionRow[];
  onSelect: (tx: TransactionRow) => void;
}

export default function TransactionsTable({ transactions, onSelect }: TransactionsTableProps) {
  return (
    <div className="overflow-x-auto w-full">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-3 py-2 text-left font-semibold">Fecha</th>
            <th className="px-3 py-2 text-left font-semibold">Comercio</th>
            <th className="px-3 py-2 text-left font-semibold">Monto</th>
            <th className="px-3 py-2 text-left font-semibold">Categoría</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr
              key={tx.id}
              className="hover:bg-slate-100 cursor-pointer transition"
              onClick={() => onSelect(tx)}
            >
              <td className="px-3 py-2 whitespace-nowrap">{tx.occurredAt ? new Date(tx.occurredAt).toLocaleDateString() : '-'}</td>
              <td className="px-3 py-2 max-w-[120px] truncate">{tx.merchantRaw || tx.merchantNormalized || '-'}</td>
              <td className="px-3 py-2 whitespace-nowrap font-medium text-right">{tx.amount.toLocaleString()} {tx.currency}</td>
              <td className="px-3 py-2 whitespace-nowrap">{tx.category?.name ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
