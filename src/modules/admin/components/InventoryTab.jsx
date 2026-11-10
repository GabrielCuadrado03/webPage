import React from 'react';
import { Info, TrendingUp, History } from 'lucide-react';

export default function InventoryTab({
  products,
  categories,
  inventoryLogs,
  metrics,
  loadingProducts,
  loadingLogs,
  openStockAdjustment
}) {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* KPI STATS DE INVENTARIO */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4.5 animate-fadeIn">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block">Productos en Catálogo</span>
          <span className="text-2xl font-extrabold text-white mt-1 block">{metrics.totalProducts}</span>
        </div>
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4.5 animate-fadeIn">
          <span className="text-[10px] font-extrabold uppercase tracking-widest block text-emerald-400">Stock Disponible (Total)</span>
          <span className="text-2xl font-extrabold text-emerald-400 mt-1 block">
            {products.reduce((acc, p) => acc + (p.stock || 0), 0)} un.
          </span>
        </div>
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4.5 animate-fadeIn">
          <span className="text-[10px] font-extrabold uppercase tracking-widest block text-red-400">Productos Agotados</span>
          <span className="text-2xl font-extrabold text-red-400 mt-1 block">
            {products.filter(p => (p.stock || 0) === 0).length}
          </span>
        </div>
      </div>

      {/* Nota explicativa */}
      <div className="p-4.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-slate-300 text-xs flex items-start space-x-3 shadow-lg">
        <Info className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
        <div className="space-y-1">
          <span className="font-bold text-slate-200">Indicador de Notificación (Menú Izquierdo)</span>
          <p className="leading-relaxed text-slate-400 font-normal">
            El número de notificación al lado de <strong>"Inventario"</strong> en la barra de navegación izquierda representa la cantidad de productos con stock crítico (aquellos con existencias <strong className="text-orange-400">por debajo de 5 unidades</strong> o <strong className="text-red-400">sin stock / agotados</strong>).
          </p>
        </div>
      </div>

      {/* Tabla de existencias */}
      <div className="bg-[#0f1424]/40 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-850 pb-3">
          <h3 className="font-extrabold text-white text-base">Control de Stock y Existencias</h3>
          <span className="text-[10px] uppercase text-slate-500 tracking-wider">Ajuste rápido de inventario</span>
        </div>

        {loadingProducts ? (
          <div className="py-8 text-center text-slate-400 text-xs">Cargando inventario...</div>
        ) : products.length === 0 ? (
          <div className="py-8 text-center text-slate-550 text-xs">No hay productos en inventario.</div>
        ) : (
          <div className="overflow-x-auto border border-slate-850 rounded-2xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-850 text-slate-450 uppercase text-[9px] font-extrabold bg-slate-950/30">
                  <th className="py-3 px-4">Producto</th>
                  <th className="py-3 px-4">Categoría</th>
                  <th className="py-3 px-4 text-center">Nivel de Stock</th>
                  <th className="py-3 px-4 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/40">
                {products.map((prod, idx) => {
                  const cat = categories.find(c => c.id === prod.categoryId);
                  return (
                    <tr key={prod.id || idx} className="hover:bg-slate-950/20 transition-colors">
                      <td className="py-3 px-4 flex items-center space-x-3">
                        <img src={prod.imageUrl} alt={prod.name} className="w-8 h-8 rounded-lg object-cover bg-slate-950" />
                        <span className="font-bold text-white">{prod.name}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-450">{cat?.name || prod.categoryId}</td>
                      <td className="py-3 px-4 text-center font-mono font-bold">
                        {prod.stock > 10 ? (
                          <span className="text-emerald-400">{prod.stock} un.</span>
                        ) : prod.stock > 0 ? (
                          <span className="text-orange-400">{prod.stock} un. (Bajo)</span>
                        ) : (
                          <span className="text-red-500 uppercase text-[9px] bg-red-500/5 px-2 py-0.5 rounded border border-red-500/10 font-bold">Agotado</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => openStockAdjustment(prod)}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 hover:text-white transition-all text-[10px] font-bold uppercase tracking-wider cursor-pointer focus:outline-none"
                        >
                          <TrendingUp className="h-3.5 w-3.5" />
                          <span>Ajustar Stock</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bitácora de Auditoría */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-5 sm:p-6 text-xs font-mono space-y-4">
        <div className="flex justify-between items-center border-b border-slate-850 pb-3">
          <div className="flex items-center space-x-2 text-white font-bold">
            <History className="h-4.5 w-4.5 text-purple-400" />
            <span>Bitácora de Auditoría del Inventario</span>
          </div>
          <span className="text-[10px] uppercase text-slate-500 tracking-wider">Historial de variaciones</span>
        </div>

        {loadingLogs ? (
          <div className="py-6 text-center text-slate-550">Cargando bitácora...</div>
        ) : inventoryLogs.length === 0 ? (
          <div className="py-6 text-center text-slate-550">Sin registros de auditoría aún.</div>
        ) : (
          <div className="max-h-60 overflow-y-auto space-y-2">
            {inventoryLogs.map((log, idx) => {
              const isReduction = (log?.changeAmount || 0) < 0;
              return (
                <div
                  key={log?.id || idx}
                  className={`border rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-left ${
                    isReduction ? 'bg-red-500/[0.015] border-red-500/10' : 'bg-emerald-500/[0.015] border-emerald-500/10'
                  }`}
                >
                  <div className="flex items-center space-x-2 text-[10px] text-slate-500">
                    <span>{log?.timestampFormatted || 'Justo ahora'}</span>
                    <span className="text-slate-700">|</span>
                    <span className="font-bold text-slate-400 uppercase">{log?.adjustedBy || 'ERP'}</span>
                  </div>
                  <div className="flex-grow space-y-0.5">
                    <span className="text-slate-200 font-bold block">{log?.productName || 'Producto'}</span>
                    <span className="text-slate-550 text-[10px] block">{log?.reason || 'Ajuste manual'}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-[10px] text-slate-500">
                      <span>Prev: {log?.previousStock || 0}u </span>
                      <span>| New: {log?.newStock || 0}u</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                        isReduction ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      {isReduction ? '-' : '+'}{Math.abs(log?.changeAmount || 0)} un.
                    </span>
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
