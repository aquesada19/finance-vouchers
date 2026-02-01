import React, { useState, useEffect } from "react";
import Select from "@/components/Select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface TransactionDetailModalProps {
  open: boolean;
  onClose: () => void;
  transaction: any | null;
}

export default function TransactionDetailModal({ open, onClose, transaction }: TransactionDetailModalProps) {
  const queryClient = useQueryClient();
  const [editCat, setEditCat] = useState(false);
  const [selectedCat, setSelectedCat] = useState<string>("");
  const [saving, setSaving] = useState(false);

  // Mantén selectedCat sincronizado con la transacción actual
  useEffect(() => {
    setSelectedCat(transaction?.category?.id ?? "");
    setEditCat(false);
    setSaving(false);
  }, [transaction]);
  // Fetch categories (igual que budgets)
  const { data: categoriesRes, isLoading: categoriesLoading } = useQuery<any, Error>({ queryKey: ['categories'], queryFn: () => fetch('/api/categories').then((r) => r.json()) });
  const categories = categoriesRes?.categories ?? [];
  // Helper para mostrar fechas
  function fmt(date: string | Date | undefined) {
    if (!date) return '-';
    try {
      return new Date(date).toLocaleString();
    } catch {
      return '-';
    }
  }
  // Guardar nueva categoría
  async function saveCategory() {
    if (!transaction?.id || !selectedCat || selectedCat === transaction.category?.id) {
      setEditCat(false); return;
    }
    setSaving(true);
    await fetch(`/api/transactions/${transaction.id}/category`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoryId: selectedCat })
    });
    setSaving(false);
    setEditCat(false);
    // Refresca stats y tabla
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['transactions', transaction.month] });
    queryClient.invalidateQueries({ queryKey: ['summary'] });
    queryClient.invalidateQueries({ queryKey: ['summary', transaction.month] });
    // Actualiza la categoría localmente para reflejar el cambio en el modal
    if (categories.length && transaction && selectedCat) {
      const newCat = categories.find((c: any) => c.id === selectedCat);
      if (newCat) {
        transaction.category = newCat;
      }
    }
  }
  if (!open || !transaction) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-2 p-0 relative animate-fade-in border border-slate-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex flex-col">
          <div className="flex items-center justify-between px-6 pt-5 pb-2 border-b">
            <div className="text-lg font-semibold">Detalle de transacción</div>
            <button
              className="text-slate-400 hover:text-red-500 text-2xl"
              onClick={onClose}
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>
          <div className="p-6 space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <div><span className="font-medium">Fecha:</span> {fmt(transaction.occurredAt)}</div>
              <div><span className="font-medium">Creado:</span> {fmt(transaction.createdAt)}</div>
              <div><span className="font-medium">Monto:</span> {transaction.amount?.toLocaleString?.() ?? transaction.amount} {transaction.currency}</div>
              {/* Categoría: mejor estructura visual */}
              <div className="col-span-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100 min-h-[70px]">
                  <span className="font-medium min-w-[80px]">Categoría:</span>
                  {editCat ? (
                    <>
                      <Select
                        value={selectedCat}
                        onChange={setSelectedCat}
                        options={categories.map((c: any) => ({ value: c.id, label: c.name }))}
                        disabled={saving || categoriesLoading}
                        placeholder="Seleccionar"
                      />
                      <div className="flex gap-2 mt-2 sm:mt-0">
                        <button
                          className="px-4 py-1 rounded bg-indigo-600 text-white text-xs font-semibold shadow-sm hover:bg-indigo-700 disabled:bg-gray-400 transition"
                          onClick={saveCategory}
                          disabled={saving || !selectedCat || selectedCat === transaction.category?.id}
                        >
                          {saving ? 'Guardando…' : 'Guardar'}
                        </button>
                        <button
                          className="px-4 py-1 rounded bg-white text-slate-700 text-xs font-semibold border border-slate-300 shadow-sm hover:bg-slate-100 transition"
                          onClick={() => { setEditCat(false); setSelectedCat(transaction.category?.id ?? ""); }}
                          disabled={saving}
                        >Cancelar</button>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-800 font-medium">{transaction.category?.name ?? "-"}</span>
                      <button
                        className="px-3 py-1 rounded bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-300 shadow-sm hover:bg-slate-200 transition"
                        onClick={() => setEditCat(true)}
                      >Editar</button>
                    </div>
                  )}
                </div>
              </div>
              {/* ...resto de los campos... */}
              <div><span className="font-medium">Comercio:</span> {transaction.merchantRaw ?? '-'}</div>
              <div><span className="font-medium">Fuente:</span> {transaction.source ?? '-'}</div>
              <div><span className="font-medium">Email asunto:</span> {transaction.emailSubject ?? '-'}</div>
              <div><span className="font-medium">Email de:</span> {transaction.emailFrom ?? '-'}</div>
              <div><span className="font-medium">ID Gmail:</span> {transaction.gmailMessageId ?? '-'}</div>
              <div><span className="font-medium">ID Thread:</span> {transaction.gmailThreadId ?? '-'}</div>
              <div><span className="font-medium">Fingerprint:</span> {transaction.fingerprint ?? '-'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
