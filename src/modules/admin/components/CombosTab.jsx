import React from 'react';
import Button from '../../../components/Button';
import ComboImageCollage from './ComboImageCollage';
import { getComboAvailabilityStatus } from '../utils/reportUtils';
import { Plus, Layers, Edit2, Trash2 } from 'lucide-react';

export default function CombosTab({
  combos,
  products,
  loadingCombos,
  openCreateCombo,
  openEditCombo,
  deleteCombo
}) {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-[#0f1424]/40 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-850 pb-4">
          <div>
            <h3 className="font-extrabold text-white text-base">Combos y Megapacks</h3>
            <p className="text-xs text-slate-400 mt-1">Arma combos de descuento compuestos por múltiples productos individuales.</p>
          </div>
          <Button
            onClick={openCreateCombo}
            variant="primary"
            size="sm"
            className="bg-pink-600 hover:bg-pink-700 shadow-md font-bold flex items-center space-x-2 border-0"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo Combo</span>
          </Button>
        </div>

        {loadingCombos ? (
          <div className="py-12 text-center text-slate-400 text-xs">Cargando combos...</div>
        ) : combos.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs space-y-3">
            <Layers className="h-8 w-8 text-slate-650 mx-auto" />
            <p>No hay combos configurados.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {combos.map((combo, idx) => {
              if (!combo) return null;
              const status = getComboAvailabilityStatus(combo, products);

              return (
                <div key={combo?.id || `combo-${idx}`} className="bg-slate-950/20 border border-slate-850 rounded-2xl overflow-hidden hover:border-pink-500/20 transition-all flex flex-col justify-between">
                  <div className="p-4 flex gap-4">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-950 flex-shrink-0">
                      <ComboImageCollage
                        productIds={combo?.productIds}
                        products={products}
                        defaultImageUrl={combo?.imageUrl}
                        className="w-full h-full"
                      />
                    </div>
                    <div className="text-left space-y-1">
                      <span className="text-[10px] font-extrabold uppercase text-pink-400">Promoción Armada</span>
                      <h4 className="font-bold text-white text-sm leading-tight line-clamp-1">{combo?.name}</h4>
                      <p className="text-[11px] text-slate-450 line-clamp-2 leading-relaxed">{combo?.description}</p>
                      <div className="flex flex-wrap gap-1.5 pt-1.5">
                        {combo?.productIds?.map((pid, pIdx) => {
                          if (!pid) return null;
                          const p = products.find(prod => prod?.id === pid);
                          return (
                            <span key={pIdx} className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-850 text-slate-350 text-[9px] truncate max-w-[120px]" title={p?.name || 'Artículo'}>
                              {p?.name || 'Artículo'}
                            </span>
                          );
                        })}
                      </div>

                      {status.issues.length > 0 && (
                        <div className="mt-2 text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1.5 rounded-lg flex flex-col space-y-0.5">
                          <span className="uppercase tracking-wider text-[8px] text-slate-450 block mb-0.5">⚠️ Alertas de Componentes:</span>
                          {status.issues.map((issue, issueIdx) => {
                            if (issue.type === 'no_encontrado') return <span key={issueIdx}>• {issue.name} (No encontrado)</span>;
                            if (issue.type === 'no_disponible') return <span key={issueIdx}>• {issue.name} (Pausado)</span>;
                            if (issue.type === 'sin_stock') return <span key={issueIdx}>• {issue.name} (Sin Stock / Agotado)</span>;
                            if (issue.type === 'stock_bajo') return <span key={issueIdx} className="text-amber-400">• {issue.name} (Bajo: {issue.stock} un.)</span>;
                            return null;
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-950/35 border-t border-slate-850 px-4 py-3 flex items-center justify-between gap-4">
                    <div className="text-left">
                      <span className="text-[9px] text-slate-500 block uppercase font-bold">Precio del Pack</span>
                      <span className="font-mono text-base font-extrabold text-white">${combo?.specialPrice?.toFixed(2) || '0.00'}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex px-2 py-0.5 rounded-lg text-[9px] font-extrabold border uppercase tracking-wider ${combo?.isAvailable ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                        {combo?.isAvailable ? 'Disponible' : 'Pausado'}
                      </span>
                      <button
                        onClick={() => openEditCombo(combo)}
                        className="p-2 rounded-lg bg-slate-900 border border-slate-850 text-indigo-400 hover:text-white transition-colors cursor-pointer"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => deleteCombo(combo?.id, combo?.name)}
                        className="p-2 rounded-lg bg-slate-900 border border-slate-850 text-red-500 hover:text-white transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
