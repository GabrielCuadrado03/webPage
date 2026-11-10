import React from 'react';
import Button from '../../../components/Button';
import { Plus, Tag, Trash2 } from 'lucide-react';

export default function CategoriesTab({
  categories,
  loadingCategories,
  openCreateCategory,
  deleteCategory
}) {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-[#0f1424]/40 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-850 pb-4">
          <div>
            <h3 className="font-extrabold text-white text-base">Categorías del Catálogo</h3>
            <p className="text-xs text-slate-400 mt-1">Administra los grupos taxonómicos en los que se dividen tus productos.</p>
          </div>
          <Button
            onClick={openCreateCategory}
            variant="primary"
            size="sm"
            className="bg-cyan-600 hover:bg-cyan-700 shadow-md font-bold flex items-center space-x-2 border-0"
          >
            <Plus className="h-4 w-4" />
            <span>Nueva Categoría</span>
          </Button>
        </div>

        {loadingCategories ? (
          <div className="py-12 text-center text-slate-400 text-xs">Cargando categorías...</div>
        ) : categories.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs space-y-3">
            <Tag className="h-8 w-8 text-slate-650 mx-auto" />
            <p>No hay categorías registradas en Firestore.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((cat, idx) => {
              if (!cat) return null;
              return (
                <div key={cat?.id || `cat-${idx}`} className="bg-slate-950/20 border border-slate-850 rounded-2xl overflow-hidden hover:border-cyan-500/25 transition-all p-4 text-center space-y-3 flex flex-col justify-between items-center relative group">
                  <button
                    onClick={() => deleteCategory(cat?.id, cat?.name)}
                    title="Eliminar categoría"
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-950 border border-slate-900 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer focus:outline-none"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>

                  <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-950 border border-slate-850 flex items-center justify-center">
                    <img src={cat?.imageUrl} alt={cat?.name} className="w-full h-full object-cover opacity-80" />
                  </div>

                  <div className="space-y-1">
                    <strong className="text-white text-xs block truncate max-w-[120px]">{cat?.name}</strong>
                    <span className="font-mono text-[9px] text-slate-500 block truncate max-w-[120px]">Slug: {cat?.id}</span>
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
