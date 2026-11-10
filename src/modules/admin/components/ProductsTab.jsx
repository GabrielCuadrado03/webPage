import React from 'react';
import Button from '../../../components/Button';
import { Plus, Package, Edit2, Trash2 } from 'lucide-react';

export default function ProductsTab({
  products,
  categories,
  loadingProducts,
  openCreateProduct,
  openEditProduct,
  deleteProduct
}) {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-[#0f1424]/40 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-850 pb-4">
          <div>
            <h3 className="font-extrabold text-white text-base">Catálogo de Productos</h3>
            <p className="text-xs text-slate-400 mt-1">Crea, edita y administra existencias del inventario individual.</p>
          </div>
          <Button
            onClick={openCreateProduct}
            variant="primary"
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 shadow-md font-bold flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo Producto</span>
          </Button>
        </div>

        {loadingProducts ? (
          <div className="py-12 text-center text-slate-400 text-xs">Cargando productos del catálogo...</div>
        ) : products.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs space-y-3">
            <Package className="h-8 w-8 text-slate-650 mx-auto" />
            <p>No hay productos en Firestore.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-850 rounded-2xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-850 text-slate-450 uppercase text-[9px] font-extrabold bg-slate-950/30">
                  <th className="py-3 px-4">Producto</th>
                  <th className="py-3 px-4">Categoría</th>
                  <th className="py-3 px-4 text-right">Precio Real</th>
                  <th className="py-3 px-4 text-center">Descuento</th>
                  <th className="py-3 px-4 text-center">Inventario</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/40">
                {products.map((prod, idx) => {
                  if (!prod) return null;
                  const hasDiscount = (prod?.userDiscount || 0) > 0;
                  const finalPrice = hasDiscount ? (prod?.price || 0) * (1 - (prod?.userDiscount || 0) / 100) : (prod?.price || 0);
                  const cat = categories.find(c => c?.id === prod?.categoryId);

                  return (
                    <tr key={prod?.id || `prod-${idx}`} className="hover:bg-slate-950/20 transition-colors">
                      <td className="py-3.5 px-4 flex items-center space-x-3">
                        <img src={prod?.imageUrl} alt={prod?.name} className="w-8 h-8 rounded-lg object-cover bg-slate-950" />
                        <div>
                          <span className="font-bold text-white block">{prod?.name || 'Artículo'}</span>
                          {prod?.isFeatured && (
                            <span className="text-[9px] font-extrabold uppercase text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/10">
                              Destacado
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-350">{cat?.name || prod?.categoryId || 'N/A'}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                        ${finalPrice.toFixed(2)}
                        {hasDiscount && <span className="text-[9px] text-slate-500 line-through block font-normal">${(prod?.price || 0).toFixed(2)}</span>}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold">
                        {hasDiscount ? <span className="text-pink-400">-{prod?.userDiscount}% OFF</span> : <span className="text-slate-600">—</span>}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {(prod?.stock || 0) > 10 ? (
                          <span className="text-emerald-400 font-mono font-bold">{prod?.stock || 0} un.</span>
                        ) : (prod?.stock || 0) > 0 ? (
                          <span className="text-orange-400 font-mono font-bold">Bajo ({prod?.stock || 0} u.)</span>
                        ) : (
                          <span className="text-red-500 font-bold uppercase tracking-wider text-[9px] bg-red-500/5 px-2 py-0.5 rounded border border-red-500/10">
                            Agotado
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => openEditProduct(prod)}
                            title="Editar especificaciones"
                            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-indigo-400 hover:text-white hover:bg-indigo-600 transition-colors cursor-pointer"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => deleteProduct(prod?.id, prod?.name)}
                            title="Eliminar del catálogo"
                            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-red-500 hover:text-white hover:bg-red-650 transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
