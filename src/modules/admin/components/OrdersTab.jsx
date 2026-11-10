import React, { useState } from 'react';
import Button from '../../../components/Button';
import {
  Info,
  Database,
  Search,
  X,
  ChevronUp,
  ChevronDown,
  Check
} from 'lucide-react';

export default function OrdersTab({
  orders,
  activeOrders,
  historyOrders,
  metrics,
  loadingOrders,
  expandedOrders,
  toggleExpand,
  actionLoading,
  confirmOrder,
  deliverOrder,
  cancelOrder
}) {
  const [ordersSubTab, setOrdersSubTab] = useState('active');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');

  const listToFilter = ordersSubTab === 'active' ? activeOrders : historyOrders;
  const filteredOrders = listToFilter.filter((o) => {
    if (!orderSearchQuery.trim()) return true;
    const q = orderSearchQuery.toLowerCase();
    const shortId = o?.id ? o.id.substring(0, 6).toLowerCase() : '';
    return (
      shortId.includes(q) ||
      (o?.id && o.id.toLowerCase().includes(q)) ||
      (o?.customerName && o.customerName.toLowerCase().includes(q)) ||
      (o?.customerPhone && o.customerPhone.toLowerCase().includes(q)) ||
      (o?.acceptedBy && o.acceptedBy.toLowerCase().includes(q))
    );
  });

  const statusBadges = {
    pendiente: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    confirmado: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    completado: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    entregado: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    cancelado: 'bg-red-500/10 border-red-500/20 text-red-400'
  };

  const statusLabels = {
    pendiente: '🟡 Pendiente',
    confirmado: '🔵 Confirmado',
    completado: '🟢 Entregado',
    entregado: '🟢 Entregado',
    cancelado: '🔴 Pedido Cancelado'
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* KPI STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4.5">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block">Total Órdenes</span>
          <span className="text-2xl font-extrabold text-white mt-1 block">{metrics.totalOrders}</span>
        </div>
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4.5">
          <span className="text-[10px] font-extrabold uppercase tracking-widest block text-amber-400">Pendientes</span>
          <span className="text-2xl font-extrabold text-amber-400 mt-1 block">{metrics.pendingOrders}</span>
        </div>
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4.5">
          <span className="text-[10px] font-extrabold uppercase tracking-widest block text-emerald-400">Completadas</span>
          <span className="text-2xl font-extrabold text-emerald-400 mt-1 block">{metrics.completedOrders}</span>
        </div>
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4.5">
          <span className="text-[10px] font-extrabold uppercase tracking-widest block text-red-500">Canceladas</span>
          <span className="text-2xl font-extrabold text-red-500 mt-1 block">
            {orders?.filter(o => o?.status === 'cancelado')?.length || 0}
          </span>
        </div>
      </div>

      {/* Nota explicativa */}
      <div className="p-4.5 rounded-2xl bg-purple-500/5 border border-purple-500/10 text-slate-300 text-xs flex items-start space-x-3 shadow-lg">
        <Info className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
        <div className="space-y-1">
          <span className="font-bold text-slate-200">Indicador de Notificación (Menú Izquierdo)</span>
          <p className="leading-relaxed text-slate-400 font-normal">
            El número de notificación al lado de <strong>"Pedidos"</strong> en la barra de navegación izquierda representa la suma de pedidos en estado <strong className="text-amber-400">🟡 Pendiente</strong> y <strong className="text-blue-400">🔵 Confirmado</strong>.
          </p>
        </div>
      </div>

      {/* Sub-pestañas de Pedidos */}
      <div className="flex border-b border-slate-800/80 mb-2">
        <button
          type="button"
          onClick={() => { setOrdersSubTab('active'); setOrderSearchQuery(''); }}
          className={`py-3 px-6 font-extrabold text-xs uppercase tracking-wider border-b-2 transition-all cursor-pointer select-none ${
            ordersSubTab === 'active'
              ? 'border-[#ff0055] text-white'
              : 'border-transparent text-slate-500 hover:text-slate-350'
          }`}
        >
          Pedidos Activos ({activeOrders.length})
        </button>
        <button
          type="button"
          onClick={() => { setOrdersSubTab('history'); setOrderSearchQuery(''); }}
          className={`py-3 px-6 font-extrabold text-xs uppercase tracking-wider border-b-2 transition-all cursor-pointer select-none ${
            ordersSubTab === 'history'
              ? 'border-[#ff0055] text-white'
              : 'border-transparent text-slate-500 hover:text-slate-350'
          }`}
        >
          Historial de Ventas ({historyOrders.length})
        </button>
      </div>

      {/* Listado de Órdenes */}
      <div className="bg-[#0f1424]/40 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-850 pb-3 gap-3">
          <div className="flex items-center space-x-3">
            <h3 className="font-extrabold text-white text-base">
              {ordersSubTab === 'active' ? 'Monitor de Pedidos Recibidos' : 'Historial de Auditoría de Ventas'}
            </h3>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold flex items-center gap-1">
              <Database className="h-3.5 w-3.5 text-purple-400" />
              En Tiempo Real
            </span>
          </div>

          <div className="w-full md:w-80 relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-550" />
            </span>
            <input
              type="text"
              placeholder="Buscar por ID, cliente, celular, vendedor..."
              value={orderSearchQuery}
              onChange={(e) => setOrderSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-550 focus:outline-none focus:border-[#ff0055]/50 transition-all font-sans"
            />
            {orderSearchQuery && (
              <button
                type="button"
                onClick={() => setOrderSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-550 hover:text-white cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {loadingOrders ? (
          <div className="py-10 text-center text-slate-400 text-xs">Cargando órdenes...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-10 text-center text-slate-550 text-xs">No hay pedidos registrados con esta pestaña.</div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order, idx) => {
              if (!order) return null;
              const shortId = order?.id ? order.id.substring(0, 6).toUpperCase() : `MOCK-${idx}`;
              const isExpanded = expandedOrders[order?.id || shortId];

              return (
                <div key={order?.id || `ord-${idx}`} className="border border-slate-850 bg-slate-950/20 rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-center gap-3">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-extrabold text-purple-400">PEDIDO #{shortId}</span>
                      <h4 className="text-sm font-bold text-white leading-none">{order?.customerName || 'Invitado'}</h4>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-lg text-[10px] font-bold border uppercase tracking-wider ${statusBadges[order?.status] || 'bg-slate-800 text-slate-400'}`}>
                        {statusLabels[order?.status] || order?.status || '🟡 Pendiente'}
                      </span>
                      <span className="font-mono text-sm font-extrabold text-purple-400">${order?.totalAmount?.toFixed(2) || '0.00'}</span>
                      <button
                        onClick={() => toggleExpand(order?.id || shortId)}
                        className="p-1 rounded-lg text-slate-500 hover:text-white transition-colors cursor-pointer focus:outline-none"
                      >
                        {isExpanded ? <ChevronUp className="h-4.5 w-4.5" /> : <ChevronDown className="h-4.5 w-4.5" />}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="pt-3 border-t border-slate-850 space-y-4 animate-fadeIn text-xs leading-normal">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/50 p-4 rounded-xl text-slate-400 border border-slate-900/60">
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Datos del Comprador (Cliente)</span>
                          <p>👤 Nombre: <strong className="text-white">{order?.customerName || 'Invitado'}</strong></p>
                          <p>📞 Celular: <strong className="text-white">{order?.customerPhone || 'N/A'}</strong></p>
                          <p>📍 Dirección: <strong className="text-white">{order?.customerAddress || 'N/A'}</strong></p>
                        </div>
                        <div className="space-y-1.5 border-t md:border-t-0 md:border-l border-slate-850 pt-2.5 md:pt-0 md:pl-4">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Auditoría de Venta</span>
                          <p>💳 Método de Pago: <strong className="text-white uppercase">{(order?.paymentMethod === 'transferencia' || order?.paymentMethod === 'whatsapp') ? 'Transferencia' : 'Efectivo'}</strong></p>
                          <p>📅 Fecha de Pedido: <strong className="text-white">{order?.createdAtFormatted || 'N/A'}</strong></p>
                          {order?.acceptedBy ? (
                            <div className="space-y-0.5 mt-2 p-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-emerald-400">
                              <p className="font-semibold text-[10px]">🛡️ Vendedor/Procesador:</p>
                              <p className="text-white font-extrabold">{order.acceptedBy}</p>
                              {order.processedAt && (
                                <p className="text-[10px] text-slate-500">
                                  Aprobado: {order.processedAt.toDate ? order.processedAt.toDate().toLocaleString('es-CO') : new Date(order.processedAt.seconds * 1000).toLocaleString('es-CO')}
                                </p>
                              )}
                              {order.deliveredAt && (
                                <p className="text-[10px] text-slate-500">
                                  Entregado: {order.deliveredAt.toDate ? order.deliveredAt.toDate().toLocaleString('es-CO') : new Date(order.deliveredAt.seconds * 1000).toLocaleString('es-CO')}
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-0.5 mt-2 p-1.5 rounded-lg bg-amber-500/5 border border-amber-500/10 text-amber-400">
                              <p className="font-semibold text-[10px]">⏳ Estado Administrativo:</p>
                              <p className="text-white font-extrabold">Pendiente de Vendedor</p>
                            </div>
                          )}
                          {order?.status === 'cancelado' && order?.cancelledAt && (
                            <div className="space-y-0.5 mt-2 p-1.5 rounded-lg bg-red-500/5 border border-red-500/10 text-red-400">
                              <p className="font-semibold text-[10px]">🔴 Cancelado el:</p>
                              <p className="text-white text-[10px]">
                                {order.cancelledAt.toDate ? order.cancelledAt.toDate().toLocaleString('es-CO') : new Date(order.cancelledAt.seconds * 1000).toLocaleString('es-CO')}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">Artículos en pedido:</span>
                        <div className="space-y-2">
                          {(order?.items || []).map((item, itemIdx) => {
                            if (!item) return null;
                            return (
                              <div key={itemIdx} className="bg-slate-950/30 border border-slate-900 p-2.5 rounded-xl flex items-center justify-between">
                                <div>
                                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">{item?.isCombo ? 'Combo' : 'Producto'}</span>
                                  <h5 className="font-bold text-white text-[12px]">{item?.name || 'Artículo'}</h5>
                                </div>
                                <div className="text-right font-mono text-[11px]">
                                  <span className="text-slate-400 block">{item?.quantity || 1} x ${item?.price?.toFixed(2) || '0.00'}</span>
                                  <span className="font-bold text-purple-300">${((item?.quantity || 1) * (item?.price || 0))?.toFixed(2)}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {order?.status === 'pendiente' && (
                        <div className="flex items-center justify-end space-x-3 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={actionLoading === (order?.id || shortId)}
                            onClick={() => cancelOrder(order?.id || shortId)}
                            className="text-red-400 hover:text-white border-red-500/20 hover:bg-red-600 font-bold"
                          >
                            Cancelar Pedido
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={actionLoading === (order?.id || shortId)}
                            onClick={() => confirmOrder(order)}
                            className="bg-[#00d2ff] hover:bg-[#00d2ff]/90 text-slate-955 shadow-md font-bold flex items-center space-x-1.5 border-none"
                          >
                            {actionLoading === (order?.id || shortId) ? (
                              <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-slate-950 border-t-transparent" />
                            ) : (
                              <>
                                <Check className="h-4 w-4" />
                                <span>Aprobar y Descontar Stock</span>
                              </>
                            )}
                          </Button>
                        </div>
                      )}

                      {order?.status === 'confirmado' && (
                        <div className="flex items-center justify-end space-x-3 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={actionLoading === (order?.id || shortId)}
                            onClick={() => cancelOrder(order?.id || shortId)}
                            className="text-red-400 hover:text-white border-red-500/20 hover:bg-red-600 font-bold"
                          >
                            Cancelar Pedido
                          </Button>
                          <Button
                            type="button"
                            disabled={actionLoading === (order?.id || shortId)}
                            onClick={() => deliverOrder(order?.id || shortId)}
                            className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all duration-300 border-none"
                          >
                            {actionLoading === (order?.id || shortId) ? (
                              <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                            ) : (
                              <>
                                <Check className="h-4 w-4" />
                                <span>Marcar como Entregado</span>
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
