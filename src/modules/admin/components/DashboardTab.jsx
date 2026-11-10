import React, { useState } from 'react';
import {
  Sparkles,
  FileText,
  TrendingUp,
  AlertTriangle,
  Plus,
  Users
} from 'lucide-react';
import {
  getPeriodEarnings,
  getDailyEarningsRange,
  getTopRevenueProducts,
  printPdfFromXml
} from '../utils/reportUtils';

export default function DashboardTab({
  orders,
  products,
  users,
  metrics,
  setActiveSection,
  openStockAdjustment,
  setErrorMsg
}) {
  const [chartRange, setChartRange] = useState('7days');
  const [activePointIndex, setActivePointIndex] = useState(null);

  const dailyEarnings = getPeriodEarnings(orders, 0);
  const weeklyEarnings = getPeriodEarnings(orders, 7);
  const monthlyEarnings = getPeriodEarnings(orders, 30);
  const topRevenueProducts = getTopRevenueProducts(orders);

  const chartData = getDailyEarningsRange(orders, chartRange);
  const chartWidth = 500;
  const chartHeight = 220;
  const paddingLeft = 45;
  const paddingRight = 15;
  const paddingTop = 25;
  const paddingBottom = 30;

  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = chartHeight - paddingTop - paddingBottom;

  const maxVal = Math.max(...chartData.map(d => d.earnings), 50);
  const roundedMaxVal = Math.ceil(maxVal / 10) * 10;

  const points = chartData.map((d, i) => {
    const x = paddingLeft + (i * (plotWidth / (chartData.length - 1 || 1)));
    const y = chartHeight - paddingBottom - ((d.earnings / roundedMaxVal) * plotHeight);
    return { x, y, ...d };
  });

  let linePath = '';
  let areaPath = '';
  if (points.length > 0) {
    linePath = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
    areaPath = `${linePath} L ${points[points.length - 1].x} ${chartHeight - paddingBottom} L ${points[0].x} ${chartHeight - paddingBottom} Z`;
  }

  const gridLines = [0, 0.33, 0.66, 1].map(ratio => ({
    val: ratio * roundedMaxVal,
    y: chartHeight - paddingBottom - (ratio * plotHeight)
  }));

  const isAllZero = chartData.every(d => d.earnings === 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Estilos de impresión PDF dinámicos */}
      <style>{`
        @media print {
          body, html, #root { background: #ffffff !important; color: #000000 !important; }
          aside, nav, button, header, .print\\:hidden { display: none !important; }
          main { width: 100% !important; max-width: 100% !important; margin: 0 !important; padding: 0 !important; background: #ffffff !important; }
          div[class*="bg-"] { background: #ffffff !important; background-color: #ffffff !important; border: 1px solid #cbd5e1 !important; box-shadow: none !important; color: #0f172a !important; }
          span, p, h1, h2, h3, h4, h5, td, th { color: #0f172a !important; }
          .text-emerald-400 { color: #047857 !important; }
          .text-purple-400 { color: #6d28d9 !important; }
          .text-indigo-400 { color: #4338ca !important; }
          .text-pink-400 { color: #be185d !important; }
          .text-amber-400 { color: #b45309 !important; }
          .text-red-400 { color: #b91c1c !important; }
          svg line { stroke: #cbd5e1 !important; }
          svg text { fill: #475569 !important; }
          circle { fill: #ffffff !important; stroke: #6d28d9 !important; }
          path.stroke-purple-500 { stroke: #6d28d9 !important; stroke-width: 3px !important; }
          path[fill="url(#chartGradient)"] { fill: rgba(109, 40, 217, 0.05) !important; }
          .grid { display: grid !important; gap: 1.5rem !important; }
          .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
          .lg\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
          .lg\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
          .xl\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
          .lg\\:col-span-2 { grid-column: span 2 / span 2 !important; }
        }
      `}</style>

      {/* Bienvenida y resumen general */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0f1424]/40 border border-slate-800 rounded-3xl p-6 backdrop-blur-md">
        <div className="text-left">
          <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-400 animate-pulse print:hidden" />
            Panel de Control General
          </h2>
          <p className="text-xs text-slate-400 mt-1">Monitoreo en tiempo real de ventas, inventario y usuarios.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => printPdfFromXml(orders, setErrorMsg)}
            className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg border border-purple-500/20 cursor-pointer select-none print:hidden focus:outline-none"
          >
            <FileText className="h-4 w-4" />
            <span>Reporte PDF</span>
          </button>
          <div className="flex items-center space-x-2 text-[10px] text-slate-500 uppercase tracking-widest font-extrabold bg-slate-950/40 px-3 py-2 rounded-xl border border-slate-850 print:hidden">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Conexión Activa ERP</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4.5 text-left relative overflow-hidden group hover:border-purple-500/20 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl pointer-events-none" />
          <span className="text-[10px] font-extrabold uppercase tracking-widest block text-purple-400">Ganancias de Hoy</span>
          <span className="text-2xl font-black text-white mt-1.5 block font-mono">${dailyEarnings.toFixed(2)}</span>
          <span className="text-[9px] text-slate-550 block mt-1">Cierre de caja diario</span>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4.5 text-left relative overflow-hidden group hover:border-indigo-500/20 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
          <span className="text-[10px] font-extrabold uppercase tracking-widest block text-indigo-400">Últimos 7 Días</span>
          <span className="text-2xl font-black text-white mt-1.5 block font-mono">${weeklyEarnings.toFixed(2)}</span>
          <span className="text-[9px] text-slate-550 block mt-1">Facturación semanal</span>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4.5 text-left relative overflow-hidden group hover:border-pink-500/20 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/5 rounded-full blur-xl pointer-events-none" />
          <span className="text-[10px] font-extrabold uppercase tracking-widest block text-pink-400">Último Mes</span>
          <span className="text-2xl font-black text-white mt-1.5 block font-mono">${monthlyEarnings.toFixed(2)}</span>
          <span className="text-[9px] text-slate-550 block mt-1">Facturación últimos 30 días</span>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4.5 text-left relative overflow-hidden group hover:border-emerald-500/20 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
          <span className="text-[10px] font-extrabold uppercase tracking-widest block text-emerald-400">Total Histórico</span>
          <span className="text-2xl font-black text-emerald-400 mt-1.5 block font-mono">${metrics.totalEarnings.toFixed(2)}</span>
          <span className="text-[9px] text-slate-550 block mt-1">Acumulado completo</span>
        </div>
      </div>

      {/* Evolución Financiera y Top Productos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#0f1424]/40 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 relative">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-850 pb-3">
            <div className="text-left">
              <h3 className="font-extrabold text-white text-sm uppercase tracking-wider flex items-center gap-2 font-sans">
                <TrendingUp className="h-4.5 w-4.5 text-purple-400" />
                Evolución de Facturación
              </h3>
              <p className="text-[10px] text-slate-450">Ventas diarias netas acumuladas de órdenes completadas.</p>
            </div>

            <div className="flex bg-slate-950/60 p-0.5 rounded-xl border border-slate-850">
              {['7days', '30days'].map(range => (
                <button
                  key={range}
                  type="button"
                  onClick={() => { setChartRange(range); setActivePointIndex(null); }}
                  className={`px-3 py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                    chartRange === range
                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      : 'text-slate-500 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  {range === '7days' ? '7 Días' : '30 Días'}
                </button>
              ))}
            </div>
          </div>

          <div className="relative pt-2">
            {isAllZero ? (
              <div className="h-[220px] flex flex-col items-center justify-center text-slate-550 space-y-1.5 border border-dashed border-slate-850 rounded-2xl bg-slate-950/10">
                <TrendingUp className="h-7 w-7 text-slate-700 animate-pulse" />
                <span className="text-[10px] uppercase tracking-wider font-bold">Sin datos de ventas en este período</span>
              </div>
            ) : (
              <div className="relative w-full overflow-hidden">
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto overflow-visible select-none">
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(147, 51, 234, 0.25)" />
                      <stop offset="100%" stopColor="rgba(147, 51, 234, 0.0)" />
                    </linearGradient>
                  </defs>

                  {gridLines.map((line, idx) => (
                    <g key={idx}>
                      <line
                        x1={paddingLeft} y1={line.y} x2={chartWidth - paddingRight} y2={line.y}
                        className="stroke-slate-850/80" strokeWidth="1" strokeDasharray="4 4"
                      />
                      <text x={paddingLeft - 8} y={line.y + 3} textAnchor="end" className="fill-slate-500 font-mono text-[9px] font-bold">
                        ${line.val.toFixed(0)}
                      </text>
                    </g>
                  ))}

                  <path d={areaPath} fill="url(#chartGradient)" />
                  <path d={linePath} fill="none" className="stroke-purple-500" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                  {activePointIndex !== null && points[activePointIndex] && (
                    <line
                      x1={points[activePointIndex].x} y1={paddingTop} x2={points[activePointIndex].x} y2={chartHeight - paddingBottom}
                      className="stroke-purple-500/40" strokeWidth="1.5" strokeDasharray="3 3"
                    />
                  )}

                  {points.map((p, i) => {
                    const showLabel = chartRange === '7days' ? true : (i % 5 === 0 || i === points.length - 1);
                    return (
                      <g key={i}>
                        {showLabel && (
                          <text x={p.x} y={chartHeight - 12} textAnchor="middle" className="fill-slate-500 font-mono text-[8px] font-extrabold uppercase">
                            {p.dateLabel}
                          </text>
                        )}
                        <circle
                          cx={p.x} cy={p.y} r={activePointIndex === i ? 5.5 : 2.5}
                          className={`transition-all duration-75 ${
                            activePointIndex === i ? 'fill-purple-400 stroke-purple-600 stroke-[2]' : 'fill-slate-900 stroke-purple-500/70 stroke-[1.5]'
                          }`}
                        />
                      </g>
                    );
                  })}

                  {points.map((p, i) => {
                    const colWidth = plotWidth / (chartData.length - 1 || 1);
                    return (
                      <rect
                        key={i} x={p.x - colWidth / 2} y={paddingTop} width={colWidth} height={plotHeight}
                        fill="transparent" className="cursor-crosshair"
                        onMouseEnter={() => setActivePointIndex(i)}
                        onMouseLeave={() => setActivePointIndex(null)}
                      />
                    );
                  })}
                </svg>

                {activePointIndex !== null && points[activePointIndex] && (
                  <div
                    className="absolute bg-slate-950/95 border border-purple-500/30 rounded-xl p-2.5 shadow-xl text-left pointer-events-none z-20 backdrop-blur-md transition-all duration-75 text-[10px] space-y-0.5"
                    style={{
                      left: `${(points[activePointIndex].x / chartWidth) * 100}%`,
                      top: `${(points[activePointIndex].y / chartHeight) * 100 - 15}%`,
                      transform: 'translate(-50%, -100%)'
                    }}
                  >
                    <span className="text-slate-550 font-extrabold block uppercase tracking-wider text-[8px]">{points[activePointIndex].dateStr}</span>
                    <span className="font-mono font-bold text-white text-xs block">
                      Facturado: <span className="text-emerald-400">${points[activePointIndex].earnings.toFixed(2)}</span>
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Top 5 Más Rentables */}
        <div className="bg-[#0f1424]/40 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-850 pb-3">
            <h3 className="font-extrabold text-white text-sm uppercase tracking-wider flex items-center gap-2 font-sans">
              <TrendingUp className="h-4.5 w-4.5 text-emerald-400" />
              Top 5 Más Rentables
            </h3>
            <span className="text-[9px] uppercase text-slate-550 tracking-wider">Por ingresos generados</span>
          </div>

          {topRevenueProducts.length === 0 ? (
            <div className="py-12 text-center text-slate-550 text-xs">No se registran ventas en órdenes completadas todavía.</div>
          ) : (
            <div className="space-y-3 font-sans">
              {topRevenueProducts.map((item, index) => (
                <div key={item.id || index} className="bg-slate-950/20 border border-slate-850 rounded-2xl p-3.5 flex items-center justify-between gap-4 font-sans">
                  <div className="flex items-center space-x-3 text-left">
                    <span className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 font-mono font-bold text-xs flex items-center justify-center">
                      #{index + 1}
                    </span>
                    <div>
                      <span className="font-bold text-white block text-xs">{item.name}</span>
                      <span className="text-[9px] font-extrabold uppercase text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/10 mt-1 inline-block">
                        {item.isCombo ? 'Combo' : 'Producto'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block font-mono">{item.quantity} un.</span>
                    <span className="font-black text-emerald-400 font-mono block text-xs">${item.revenue.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Grid: Stock Crítico & Últimos Usuarios */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-[#0f1424]/40 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 font-sans">
          <div className="flex justify-between items-center border-b border-slate-850 pb-3">
            <h3 className="font-extrabold text-white text-sm uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="h-4.5 w-4.5 text-amber-500" />
              Productos por Agotarse (Stock Crítico)
            </h3>
            <span className="text-[9px] uppercase text-slate-550 tracking-wider">Menos de 5 unidades</span>
          </div>

          {products.filter(p => (p.stock || 0) <= 5).length === 0 ? (
            <div className="py-6 text-center text-slate-550 text-xs">No hay productos con stock crítico. ¡Todo surtido!</div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {products
                .filter(p => (p.stock || 0) <= 5)
                .map((prod, idx) => (
                  <div key={prod.id || idx} className="bg-slate-950/20 border border-slate-850 rounded-xl p-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center space-x-2.5 text-left">
                      <img src={prod.imageUrl} alt={prod.name} className="w-7 h-7 rounded-md object-cover bg-slate-950" />
                      <span className="font-bold text-white text-xs block truncate max-w-[180px]">{prod.name}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      {prod.stock <= 0 ? (
                        <span className="px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 font-mono text-[10px] font-bold uppercase tracking-wider">
                          Agotado
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono text-[10px] font-bold">
                          Quedan {prod.stock} un.
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveSection('inventory');
                          setTimeout(() => openStockAdjustment(prod), 100);
                        }}
                        className="p-1 rounded-lg bg-slate-900 border border-slate-800 text-emerald-400 hover:text-white hover:bg-emerald-600 cursor-pointer transition-colors"
                        title="Abastecer Stock"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="bg-[#0f1424]/40 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 font-sans">
          <div className="flex justify-between items-center border-b border-slate-850 pb-3">
            <h3 className="font-extrabold text-white text-sm uppercase tracking-wider flex items-center gap-2">
              <Users className="h-4.5 w-4.5 text-indigo-400" />
              Últimos Usuarios Registrados
            </h3>
            <span className="text-[9px] uppercase text-slate-550 tracking-wider">Base de clientes</span>
          </div>

          {users.length === 0 ? (
            <div className="py-6 text-center text-slate-550 text-xs">No hay usuarios registrados aún.</div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {users.slice(0, 5).map((u, idx) => (
                <div key={u.id || idx} className="bg-slate-950/20 border border-slate-850 rounded-xl p-2.5 flex items-center justify-between gap-3 text-left">
                  <div className="space-y-0.5">
                    <span className="font-bold text-white text-xs block">{u.displayName}</span>
                    <span className="text-[10px] text-slate-455 block truncate max-w-[200px]">{u.email}</span>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-bold border uppercase tracking-wider ${
                      u.role === 'admin'
                        ? 'bg-red-500/10 border-red-500/20 text-red-400'
                        : u.role === 'premium'
                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                        : 'bg-slate-800 border-slate-700 text-slate-450'
                    }`}>
                      {u.role}
                    </span>
                    <span className="text-[8px] text-slate-550 block mt-0.5">{u.createdAtFormatted}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
