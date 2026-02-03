import React from "react";
import Select from "@/components/Select";

interface TransactionsFiltersProps {
  filters: {
    merchant: string;
    minAmount: string;
    maxAmount: string;
    categoryId: string;
    orderBy: string;
    orderDir: string;
  };
  setFilters: (fn: (f: any) => any) => void;
  categories: { id: string; name: string }[];
  show: boolean;
  setShow: (v: boolean) => void;
  month: string;
}

export default function TransactionsFilters({ filters, setFilters, categories, show, setShow }: TransactionsFiltersProps) {

  return (
    <>
      {/* Botón de filtros en mobile */}
      <div className="flex justify-end mt-4 md:hidden">
        <button className="px-3 py-1 rounded bg-slate-100 text-slate-700 text-xs border border-slate-300" onClick={() => setShow(!show)}>
          {show ? "Ocultar filtros" : "Filtros"}
        </button>
      </div>
      {/* Filtros avanzados: siempre visible en desktop, toggle en mobile */}
      <div className={`transition-all ${show ? 'block' : 'hidden'} md:block mb-6 mt-4`}>
        <div className="flex flex-col md:flex-row md:items-end gap-4 flex-wrap bg-white rounded-xl border border-slate-200 px-6 py-4">
          <div className="flex flex-col gap-1 min-w-[140px]">
            <label className="block text-xs font-semibold text-slate-500">Comercio</label>
            <input type="text" className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:ring-0 transition-colors" placeholder="Buscar comercio" value={filters.merchant} onChange={e => setFilters(f => ({ ...f, merchant: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-1 min-w-[120px]">
            <label className="block text-xs font-semibold text-slate-500">Monto mínimo</label>
            <input type="number" className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:ring-0 transition-colors" placeholder="Min" value={filters.minAmount} onChange={e => setFilters(f => ({ ...f, minAmount: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-1 min-w-[120px]">
            <label className="block text-xs font-semibold text-slate-500">Monto máximo</label>
            <input type="number" className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:ring-0 transition-colors" placeholder="Max" value={filters.maxAmount} onChange={e => setFilters(f => ({ ...f, maxAmount: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-1 min-w-[160px]">
            <label className="block text-xs font-semibold text-slate-500">Categoría</label>
            <Select
              value={filters.categoryId}
              onChange={v => setFilters(f => ({ ...f, categoryId: v }))}
              options={[{ value: "", label: "Todas" }, ...categories.map((c: any) => ({ value: c.id, label: c.name }))]}
              placeholder="Todas"
            />
          </div>
          <div className="flex flex-col gap-1 min-w-[160px]">
            <label className="block text-xs font-semibold text-slate-500">Ordenar por</label>
            <Select
              value={filters.orderBy}
              onChange={v => setFilters(f => ({ ...f, orderBy: v }))}
              options={[
                { value: "occurredAt", label: "Fecha" },
                { value: "amount", label: "Monto" },
                { value: "merchantRaw", label: "Comercio" },
                { value: "categoryId", label: "Categoría" }
              ]}
            />
          </div>
          <div className="flex flex-col gap-1 min-w-[120px]">
            <label className="block text-xs font-semibold text-slate-500">Dirección</label>
            <Select
              value={filters.orderDir}
              onChange={v => setFilters(f => ({ ...f, orderDir: v }))}
              options={[
                { value: "desc", label: "Descendente" },
                { value: "asc", label: "Ascendente" }
              ]}
            />
          </div>
        </div>
      </div>
    </>
  );
}
