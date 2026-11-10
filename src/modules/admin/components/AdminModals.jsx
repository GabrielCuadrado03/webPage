import React from 'react';
import Button from '../../../components/Button';
import {
  Package,
  Layers,
  Image,
  Tag,
  Database,
  Upload,
  Link as LinkIcon,
  CheckSquare,
  Square,
  X
} from 'lucide-react';

function ImageField({
  label,
  value,
  onChange,
  uploadingImage,
  onFileUpload,
  accentClass = 'text-indigo-400 hover:text-indigo-300',
  focusBorderClass = 'focus:border-indigo-500',
  previewClass = 'w-12 h-12 rounded-lg',
  placeholder = 'Pegar URL directa de la foto o subir archivo a Storage...'
}) {
  return (
    <div className="space-y-2 border-t border-slate-850 pt-3 font-sans">
      <div className="flex justify-between items-center">
        <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{label}</label>
        <label className={`text-[10px] font-bold transition-colors cursor-pointer flex items-center space-x-1 ${accentClass}`}>
          <Upload className="h-3.5 w-3.5" />
          <span>{uploadingImage ? 'Subiendo...' : 'Subir a Storage'}</span>
          <input
            type="file"
            accept="image/*"
            disabled={uploadingImage}
            className="hidden"
            onChange={(e) => onFileUpload(e, onChange)}
          />
        </label>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
          <LinkIcon className="h-4 w-4" />
        </div>
        <input
          type="text"
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full pl-9 pr-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-250 placeholder-slate-650 focus:outline-none ${focusBorderClass} transition-all font-sans`}
        />
      </div>

      {value.trim() && (
        <div className="flex items-center space-x-3.5 bg-slate-950/30 border border-slate-850 p-2.5 rounded-xl">
          <img src={value} alt="preview" className={`${previewClass} object-cover bg-slate-950`} />
          <span className="text-[10px] text-slate-500 truncate max-w-[340px]">{value}</span>
        </div>
      )}
    </div>
  );
}

export default function AdminModals({
  // Productos
  showProductModal,
  setShowProductModal,
  editingProduct,
  productForm,
  setProductForm,
  saveProduct,
  categories,
  // Combos
  showComboModal,
  setShowComboModal,
  editingCombo,
  comboForm,
  setComboForm,
  saveCombo,
  products,
  addProductIdToCombo,
  removeProductIdFromCombo,
  getComboMaquetadoInfo,
  // Banners
  showBannerModal,
  setShowBannerModal,
  editingBanner,
  bannerForm,
  setBannerForm,
  saveBanner,
  // Categorías
  showCategoryModal,
  setShowCategoryModal,
  categoryForm,
  setCategoryForm,
  saveCategory,
  // Stock
  showStockModal,
  setShowStockModal,
  stockAdjustmentProduct,
  stockForm,
  setStockForm,
  handleStockAdjustment,
  // Compartido
  uploadingImage,
  handleImageUpload
}) {
  return (
    <>
      {/* 1. MODAL: CRUD PRODUCTOS */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0e1326] border border-indigo-500/20 rounded-3xl max-w-xl w-full shadow-2xl relative overflow-hidden transform scale-100 transition-all max-h-[90vh] flex flex-col text-left font-sans">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="p-6 border-b border-slate-850 flex justify-between items-center flex-shrink-0 font-sans">
              <h3 className="font-extrabold text-white text-base flex items-center space-x-2">
                <Package className="h-4.5 w-4.5 text-indigo-400" />
                <span>{editingProduct ? `Editar Producto: "${editingProduct.name}"` : 'Agregar Nuevo Producto'}</span>
              </h3>
              <button onClick={() => setShowProductModal(false)} className="text-slate-450 hover:text-white font-bold p-1 cursor-pointer focus:outline-none">×</button>
            </div>

            <form onSubmit={saveProduct} className="p-6 overflow-y-auto space-y-4 flex-grow text-xs leading-normal font-sans">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Nombre del Producto *</label>
                <input
                  type="text" required value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="Neon Vaporizer Pro"
                  className="w-full px-3.5 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Descripción del Producto</label>
                <textarea
                  rows="2" value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Especificaciones, sabor, capacidad de batería, etc..."
                  className="w-full px-3.5 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 transition-all font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Categoría *</label>
                  <select
                    value={productForm.categoryId}
                    onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-350 focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
                  >
                    {categories.map((cat, idx) => cat && <option key={cat?.id || `opt-${idx}`} value={cat?.id}>{cat?.name}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Existencias (Stock) *</label>
                  <input
                    type="number" min="0" required value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    placeholder="25"
                    className="w-full px-3.5 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Precio Base ($) *</label>
                  <input
                    type="number" step="0.01" min="0" required value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    placeholder="120.00"
                    className="w-full px-3.5 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 transition-all font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Descuento (%)</label>
                  <input
                    type="number" min="0" max="100" value={productForm.userDiscount}
                    onChange={(e) => setProductForm({ ...productForm, userDiscount: e.target.value })}
                    placeholder="15"
                    className="w-full px-3.5 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 transition-all font-mono"
                  />
                </div>
              </div>

              <ImageField
                label="Imagen del Producto *"
                value={productForm.imageUrl}
                onChange={(url) => setProductForm(p => ({ ...p, imageUrl: url }))}
                uploadingImage={uploadingImage}
                onFileUpload={handleImageUpload}
              />

              <div className="grid grid-cols-2 gap-4 border-t border-slate-850 pt-3.5">
                <button
                  type="button"
                  onClick={() => setProductForm({ ...productForm, isFeatured: !productForm.isFeatured })}
                  className="flex items-center justify-between p-3 bg-slate-950/30 border border-slate-850 hover:border-slate-800 rounded-xl text-left cursor-pointer transition-colors"
                >
                  <span className="font-bold text-slate-350">Destacar Producto</span>
                  {productForm.isFeatured ? <CheckSquare className="h-4.5 w-4.5 text-purple-400" /> : <Square className="h-4.5 w-4.5 text-slate-600" />}
                </button>

                <button
                  type="button"
                  onClick={() => setProductForm({ ...productForm, isAvailable: !productForm.isAvailable })}
                  className="flex items-center justify-between p-3 bg-slate-950/30 border border-slate-850 hover:border-slate-800 rounded-xl text-left cursor-pointer transition-colors"
                >
                  <span className="font-bold text-slate-350">Habilitar en Catálogo</span>
                  {productForm.isAvailable ? <CheckSquare className="h-4.5 w-4.5 text-indigo-400" /> : <Square className="h-4.5 w-4.5 text-slate-600" />}
                </button>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-850 flex-shrink-0">
                <Button variant="outline" size="sm" onClick={() => setShowProductModal(false)} className="font-bold cursor-pointer">Cerrar</Button>
                <Button variant="primary" size="sm" type="submit" className="bg-indigo-600 hover:bg-indigo-700 shadow-md font-bold cursor-pointer">Guardar Especificaciones</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. MODAL: CRUD COMBOS */}
      {showComboModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0e1326] border border-violet-500/20 rounded-3xl max-w-2xl w-full shadow-2xl relative overflow-hidden transform scale-100 transition-all max-h-[90vh] flex flex-col text-left font-sans">
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="p-6 border-b border-slate-850 flex justify-between items-center flex-shrink-0">
              <h3 className="font-extrabold text-white text-base flex items-center space-x-2">
                <Layers className="h-4.5 w-4.5 text-violet-400" />
                <span>{editingCombo ? `Modificar Combo: "${editingCombo.name}"` : 'Maquetar Nuevo Combo Promocional'}</span>
              </h3>
              <button onClick={() => setShowComboModal(false)} className="text-slate-450 hover:text-white font-bold p-1 cursor-pointer focus:outline-none">×</button>
            </div>

            <form onSubmit={saveCombo} className="p-6 overflow-y-auto space-y-5 flex-grow text-xs leading-normal">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Nombre del Combo *</label>
                  <input
                    type="text" required value={comboForm.name}
                    onChange={(e) => setComboForm({ ...comboForm, name: e.target.value })}
                    placeholder="Mega Starter Pack"
                    className="w-full px-3.5 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-violet-500 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Precio Especial Combo ($) *</label>
                  <input
                    type="number" step="0.01" min="0" required value={comboForm.specialPrice}
                    onChange={(e) => setComboForm({ ...comboForm, specialPrice: e.target.value })}
                    placeholder="145.00"
                    className="w-full px-3.5 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-violet-500 transition-all font-mono"
                  />
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Descripción del Pack Promocional</label>
                  <textarea
                    rows="2" value={comboForm.description}
                    onChange={(e) => setComboForm({ ...comboForm, description: e.target.value })}
                    placeholder="Describe los productos que integra..."
                    className="w-full px-3.5 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-violet-500 transition-all font-sans"
                  />
                </div>
              </div>

              <div className="space-y-3.5 border-t border-slate-850 pt-4 font-sans">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block">Maquetador de Artículos Constituyentes</span>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-6 space-y-2 text-left">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">1. Seleccionar del catálogo:</span>
                    <div className="border border-slate-850 rounded-xl p-2 max-h-40 overflow-y-auto space-y-1.5 bg-slate-950/30">
                      {products.map((prod) => prod && (
                        <div key={prod?.id} className="flex justify-between items-center bg-slate-950/50 p-2 rounded-lg text-[10px]">
                          <span className="truncate max-w-[140px] font-bold text-slate-200">{prod?.name}</span>
                          <button
                            type="button"
                            onClick={() => addProductIdToCombo(prod?.id)}
                            className="px-2 py-1 rounded bg-violet-500/10 hover:bg-violet-600 border border-violet-500/20 hover:border-violet-500 text-violet-400 hover:text-white transition-all font-bold cursor-pointer"
                          >
                            Agregar
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-6 space-y-2 text-left">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">2. Integrados en el Combo:</span>
                    <div className="border border-slate-850 rounded-xl p-2.5 max-h-40 overflow-y-auto space-y-1.5 bg-slate-950/30">
                      {comboForm.productIds.length === 0 ? (
                        <p className="text-[10px] text-slate-650 italic py-4 text-center font-sans">Usa el botón de agregar para poblar el combo.</p>
                      ) : (
                        Object.entries(
                          comboForm.productIds.reduce((acc, curr) => {
                            if (curr) acc[curr] = (acc[curr] || 0) + 1;
                            return acc;
                          }, {})
                        ).map(([pid, qty]) => {
                          const p = products.find(prod => prod?.id === pid);
                          return (
                            <div key={pid} className="flex justify-between items-center bg-slate-950/50 p-2 rounded-lg text-[10px]">
                              <span className="truncate max-w-[120px] font-bold text-white">{p?.name || 'Artículo'}</span>
                              <div className="flex items-center space-x-2 font-mono">
                                <span className="text-slate-400">Qty: {qty}</span>
                                <button
                                  type="button"
                                  onClick={() => removeProductIdFromCombo(pid)}
                                  className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                {comboForm.productIds.length > 0 && (
                  <div className="bg-violet-500/[0.015] border border-violet-500/10 p-3 rounded-xl flex items-center justify-between text-slate-400 text-[10.5px] font-sans">
                    <div className="space-y-0.5 text-left font-sans">
                      <span>Costo original sugerido (con descuentos del catálogo):</span>
                      <strong className="text-white block font-mono text-xs">${getComboMaquetadoInfo().originalTotal.toFixed(2)}</strong>
                    </div>
                    {getComboMaquetadoInfo().saving > 0 && (
                      <div className="text-right space-y-0.5 font-sans">
                        <span className="text-violet-400 font-bold block uppercase tracking-wider text-[9px] font-sans">¡Mega Ahorro!</span>
                        <strong className="text-violet-300 font-mono">-${getComboMaquetadoInfo().saving.toFixed(2)} ({getComboMaquetadoInfo().savingPct.toFixed(0)}% OFF)</strong>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <ImageField
                label="Imagen del Combo Promocional *"
                value={comboForm.imageUrl}
                onChange={(url) => setComboForm(c => ({ ...c, imageUrl: url }))}
                uploadingImage={uploadingImage}
                onFileUpload={handleImageUpload}
                accentClass="text-violet-400 hover:text-violet-300"
                focusBorderClass="focus:border-violet-500"
              />

              <div className="border-t border-slate-850 pt-3.5 font-sans">
                <button
                  type="button"
                  onClick={() => setComboForm({ ...comboForm, isAvailable: !comboForm.isAvailable })}
                  className="w-full flex items-center justify-between p-3 bg-slate-950/30 border border-slate-850 hover:border-slate-800 rounded-xl text-left cursor-pointer transition-colors"
                >
                  <span className="font-bold text-slate-350 font-sans">Habilitar Combo en la Tienda</span>
                  {comboForm.isAvailable ? <CheckSquare className="h-4.5 w-4.5 text-violet-400" /> : <Square className="h-4.5 w-4.5 text-slate-600" />}
                </button>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-850 flex-shrink-0 font-sans">
                <Button variant="outline" size="sm" onClick={() => setShowComboModal(false)} className="font-bold cursor-pointer">Cerrar</Button>
                <Button variant="primary" size="sm" type="submit" className="bg-violet-600 hover:bg-violet-700 shadow-md font-bold cursor-pointer border-0 text-white">Guardar Configuración Combo</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. MODAL: CRUD BANNERS */}
      {showBannerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0e1326] border border-emerald-500/20 rounded-3xl max-w-xl w-full shadow-2xl relative overflow-hidden transform scale-100 transition-all max-h-[90vh] flex flex-col text-left font-sans">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="p-6 border-b border-slate-850 flex justify-between items-center flex-shrink-0">
              <h3 className="font-extrabold text-white text-base flex items-center space-x-2">
                <Image className="h-4.5 w-4.5 text-emerald-400" />
                <span>{editingBanner ? 'Editar Campaña Publicitaria' : 'Programar Nueva Campaña Hero'}</span>
              </h3>
              <button onClick={() => setShowBannerModal(false)} className="text-slate-450 hover:text-white font-bold p-1 cursor-pointer focus:outline-none">×</button>
            </div>

            <form onSubmit={saveBanner} className="p-6 overflow-y-auto space-y-4 flex-grow text-xs leading-normal">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Título de la Campaña (Principal) *</label>
                  <input
                    type="text" required value={bannerForm.title}
                    onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                    placeholder="ETHEREAL VAPES"
                    className="w-full px-3.5 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Subtítulo de la Campaña</label>
                  <input
                    type="text" value={bannerForm.subtitle}
                    onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                    placeholder="ESFERA PREMIUM"
                    className="w-full px-3.5 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Descripción / Mensaje Publicitario</label>
                <textarea
                  rows="2.5" value={bannerForm.description}
                  onChange={(e) => setBannerForm({ ...bannerForm, description: e.target.value })}
                  placeholder="Explica la promoción..."
                  className="w-full px-3.5 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500 transition-all font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Etiqueta de Enlace (Texto del Botón)</label>
                  <input
                    type="text" value={bannerForm.linkText}
                    onChange={(e) => setBannerForm({ ...bannerForm, linkText: e.target.value })}
                    placeholder="Explorar Catálogo"
                    className="w-full px-3.5 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">URL / Path de Redirección</label>
                  <input
                    type="text" value={bannerForm.linkUrl}
                    onChange={(e) => setBannerForm({ ...bannerForm, linkUrl: e.target.value })}
                    placeholder="/products o /combos"
                    className="w-full px-3.5 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500 transition-all font-mono"
                  />
                </div>
              </div>

              <ImageField
                label="Imagen de Fondo de Campaña *"
                value={bannerForm.imageUrl}
                onChange={(url) => setBannerForm(b => ({ ...b, imageUrl: url }))}
                uploadingImage={uploadingImage}
                onFileUpload={handleImageUpload}
                accentClass="text-emerald-400 hover:text-emerald-300"
                focusBorderClass="focus:border-emerald-500"
                previewClass="w-16 h-10 rounded-lg"
              />

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-850 flex-shrink-0">
                <Button variant="outline" size="sm" onClick={() => setShowBannerModal(false)} className="font-bold cursor-pointer">Cerrar</Button>
                <Button variant="primary" size="sm" type="submit" className="bg-emerald-600 hover:bg-emerald-700 shadow-md font-bold cursor-pointer border-0 text-white font-sans">Programar Banner Campaña</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. MODAL: CRUD CATEGORÍAS */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0e1326] border border-cyan-500/20 rounded-3xl max-w-md w-full shadow-2xl relative overflow-hidden transform scale-100 transition-all text-left font-sans">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

            <div className="p-5 border-b border-slate-850 flex justify-between items-center">
              <h3 className="font-extrabold text-white text-base flex items-center space-x-2">
                <Tag className="h-4.5 w-4.5 text-cyan-400" />
                <span>Agregar Nueva Categoría</span>
              </h3>
              <button onClick={() => setShowCategoryModal(false)} className="text-slate-450 hover:text-white font-bold p-1 cursor-pointer focus:outline-none">×</button>
            </div>

            <form onSubmit={saveCategory} className="p-5 space-y-4 text-xs leading-normal">
              <div className="space-y-1 font-sans">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Nombre de la Categoría *</label>
                <input
                  type="text" required value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="Vaporizadores o E-Liquids"
                  className="w-full px-3.5 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500 transition-all font-sans"
                />
              </div>

              <div className="space-y-1 font-sans">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Slug / ID único (Opcional)</label>
                <input
                  type="text" value={categoryForm.id}
                  onChange={(e) => setCategoryForm({ ...categoryForm, id: e.target.value })}
                  placeholder="vapes o liquids (autogenerado)"
                  className="w-full px-3.5 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500 transition-all font-mono"
                />
              </div>

              <ImageField
                label="Imagen / Icono de Categoría *"
                value={categoryForm.imageUrl}
                onChange={(url) => setCategoryForm(c => ({ ...c, imageUrl: url }))}
                uploadingImage={uploadingImage}
                onFileUpload={handleImageUpload}
                accentClass="text-cyan-400 hover:text-cyan-300"
                focusBorderClass="focus:border-cyan-500"
                previewClass="w-10 h-10 rounded-full border border-slate-800"
                placeholder="Pegar URL directa..."
              />

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-850">
                <Button variant="outline" size="sm" onClick={() => setShowCategoryModal(false)} className="font-bold cursor-pointer">Cerrar</Button>
                <Button variant="primary" size="sm" type="submit" className="bg-cyan-600 hover:bg-cyan-700 shadow-md font-bold cursor-pointer border-0 text-white font-sans">Crear Categoría</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: AJUSTE DE INVENTARIO (FAST STOCK MANAGER) */}
      {showStockModal && stockAdjustmentProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0e1326] border border-emerald-500/20 rounded-3xl max-w-md w-full shadow-2xl relative overflow-hidden transform scale-100 transition-all text-left font-sans">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

            <div className="p-5 border-b border-slate-850 flex justify-between items-center">
              <h3 className="font-extrabold text-white text-base flex items-center space-x-2">
                <Database className="h-4.5 w-4.5 text-emerald-400" />
                <span>Ajustar Inventario</span>
              </h3>
              <button type="button" onClick={() => setShowStockModal(false)} className="text-slate-450 hover:text-white font-bold p-1 cursor-pointer focus:outline-none">×</button>
            </div>

            <form onSubmit={handleStockAdjustment} className="p-5 space-y-4 text-xs leading-normal">
              <div className="bg-slate-950/40 border border-slate-850 p-3.5 rounded-2xl flex items-center space-x-3">
                <img src={stockAdjustmentProduct.imageUrl} alt={stockAdjustmentProduct.name} className="w-12 h-12 rounded-xl object-cover bg-slate-950 border border-slate-800" />
                <div className="space-y-0.5 truncate">
                  <span className="font-bold text-white block truncate text-xs">{stockAdjustmentProduct.name}</span>
                  <span className="text-[10px] text-slate-500 block truncate">
                    Stock Actual: <strong className="text-white font-mono">{stockAdjustmentProduct.stock} unidades</strong>
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Tipo de Ajuste</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setStockForm({ ...stockForm, action: 'add' })}
                    className={`py-2 px-3 rounded-xl border font-bold text-center uppercase tracking-wider text-[10px] transition-all cursor-pointer ${
                      stockForm.action === 'add' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-slate-950/50 border-slate-850 text-slate-500 hover:border-slate-800'
                    }`}
                  >
                    Agregar Stock (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setStockForm({ ...stockForm, action: 'subtract' })}
                    className={`py-2 px-3 rounded-xl border font-bold text-center uppercase tracking-wider text-[10px] transition-all cursor-pointer ${
                      stockForm.action === 'subtract' ? 'bg-red-500/10 border-red-500 text-red-400' : 'bg-slate-950/50 border-slate-850 text-slate-500 hover:border-slate-800'
                    }`}
                  >
                    Retirar Stock (-)
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Cantidad de Unidades</label>
                <input
                  type="number" required min="1" value={stockForm.amount}
                  onChange={(e) => setStockForm({ ...stockForm, amount: e.target.value.replace(/\D/g, '') })}
                  placeholder="Ej: 10"
                  className="w-full px-3.5 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500 transition-all font-mono text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Motivo de Ajuste</label>
                <select
                  value={stockForm.reason}
                  onChange={(e) => setStockForm({ ...stockForm, reason: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-300 focus:outline-none focus:border-emerald-500 transition-all font-sans text-xs"
                >
                  <option value="Compra/Ingreso de mercadería">Compra/Ingreso de mercadería</option>
                  <option value="Corrección de inventario">Corrección de inventario</option>
                  <option value="Ajuste por merma (Pérdida/Desecho)">Ajuste por merma (Pérdida/Desecho)</option>
                  <option value="Devolución de cliente">Devolución de cliente</option>
                </select>
              </div>

              {stockForm.amount && !isNaN(parseInt(stockForm.amount)) && (
                <div className={`p-3 rounded-xl border border-slate-800 flex items-center justify-between text-[11px] ${
                  stockForm.action === 'add' ? 'bg-emerald-500/[0.015] border-emerald-500/10' : 'bg-red-500/[0.015] border-red-500/10'
                }`}>
                  <span className="text-slate-500 font-bold uppercase">Previsualización:</span>
                  <div className="flex items-center space-x-2 font-mono">
                    <span className="text-slate-400">{stockAdjustmentProduct.stock} u.</span>
                    <span className="text-slate-650">➔</span>
                    <span className={`font-bold ${stockForm.action === 'add' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {stockForm.action === 'add' ? '+' : '-'}{parseInt(stockForm.amount)} u.
                    </span>
                    <span className="text-slate-650">➔</span>
                    <span className="font-extrabold text-white underline">
                      {stockForm.action === 'add' ? stockAdjustmentProduct.stock + parseInt(stockForm.amount) : Math.max(0, stockAdjustmentProduct.stock - parseInt(stockForm.amount))} u.
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-850">
                <Button variant="outline" size="sm" onClick={() => setShowStockModal(false)} className="font-bold cursor-pointer">Cerrar</Button>
                <Button variant="primary" size="sm" type="submit" className="bg-emerald-600 hover:bg-emerald-700 shadow-md font-bold cursor-pointer border-0 text-white font-sans">Ajustar Existencias</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
