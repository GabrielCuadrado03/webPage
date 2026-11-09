import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useCart } from '../../context/CartContext';
import Button from '../../components/Button';
import { getPlaceholderImage } from '../../utils/placeholders';
import { 
  Sparkles, 
  Layers, 
  ShoppingBag, 
  ShoppingCart,
  X, 
  Plus, 
  Minus, 
  Check, 
  Info,
  Gift
} from 'lucide-react';

// Componente premium de Collage de Imágenes para Combos
const ComboImageCollage = ({ productIds, products, defaultImageUrl, className = "" }) => {
  // Map productIds to actual product images (using Firestore products or mock fallback)
  const images = (productIds || [])
    .map(pid => {
      const p = products.find(prod => prod.id === pid);
      return p?.imageUrl || null;
    })
    .filter(Boolean);

  // Obtener urls de imágenes únicas para el collage
  const uniqueImages = [...new Set(images)];

  if (uniqueImages.length === 0) {
    return (
      <div className={`w-full h-full relative overflow-hidden bg-slate-950 ${className}`}>
        <img 
          src={defaultImageUrl || getPlaceholderImage('Combo')} 
          alt="Combo default" 
          className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-all duration-500 group-hover:scale-105"
        />
      </div>
    );
  }

  if (uniqueImages.length === 1) {
    return (
      <div className={`w-full h-full relative overflow-hidden bg-slate-950 ${className}`}>
        <img 
          src={uniqueImages[0]} 
          alt="Combo product 1" 
          className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-all"
        />
      </div>
    );
  }

  if (uniqueImages.length === 2) {
    return (
      <div className={`w-full h-full grid grid-cols-2 gap-[1.5px] bg-slate-800 relative ${className}`}>
        {uniqueImages.slice(0, 2).map((img, idx) => (
          <img 
            key={idx} 
            src={img} 
            alt={`Combo product ${idx + 1}`} 
            className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-all"
          />
        ))}
      </div>
    );
  }

  if (uniqueImages.length === 3) {
    return (
      <div className={`w-full h-full grid grid-cols-3 gap-[1.5px] bg-slate-850 relative ${className}`}>
        <div className="col-span-2 h-full w-full">
          <img 
            src={uniqueImages[0]} 
            alt="Combo product 1" 
            className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-all"
          />
        </div>
        <div className="grid grid-rows-2 gap-[1.5px] h-full w-full">
          <img 
            src={uniqueImages[1]} 
            alt="Combo product 2" 
            className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-all"
          />
          <img 
            src={uniqueImages[2]} 
            alt="Combo product 3" 
            className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-all"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full h-full grid grid-cols-2 grid-rows-2 gap-[1.5px] bg-slate-850 relative ${className}`}>
      {uniqueImages.slice(0, 4).map((img, idx) => (
        <img 
          key={idx} 
          src={img} 
          alt={`Combo product ${idx + 1}`} 
          className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-all"
        />
      ))}
    </div>
  );
};

export default function Combos() {
  const { addToCart } = useCart();

  // Estados de carga de datos
  const [combos, setCombos] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estado del Modal de Detalle de Combo
  const [selectedCombo, setSelectedCombo] = useState(null);
  const [comboQuantity, setComboQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState('collage');

  // Conexión real-time con Firestore
  useEffect(() => {
    setLoading(true);

    // Escuchar productos en tiempo real para obtener imágenes dinámicas
    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const prodList = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const priceRaw = data.price;
        const priceVal = typeof priceRaw === 'number' 
          ? priceRaw 
          : parseFloat(priceRaw?.toString() || '') || 0.0;

        const discountRaw = data.userDiscount !== undefined ? data.userDiscount : data.discount;
        const discountVal = typeof discountRaw === 'number' 
          ? discountRaw 
          : parseFloat(discountRaw?.toString() || '') || 0.0;

        prodList.push({
          id: doc.id,
          name: data.name || '',
          imageUrl: data.imageUrl || '',
          price: priceVal,
          discount: discountVal,
          userDiscount: discountVal,
          stock: typeof data.stock === 'number' ? data.stock : parseInt(data.stock?.toString()) || 0,
          isAvailable: data.isAvailable !== false
        });
      });
      setProducts(prodList);
    }, (error) => {
      console.warn("Firestore: Error al traer productos en combos", error);
    });

    const unsubCombos = onSnapshot(collection(db, 'combos'), (snapshot) => {
      const comboList = [];
      snapshot.forEach((doc) => {
        const data = doc.data();

        // PARSEO DEFENSIVO COMPATIBLE CON FLUTTER
        const priceRaw = data.specialPrice;
        const priceVal = typeof priceRaw === 'number' 
          ? priceRaw 
          : parseFloat(priceRaw?.toString() || '') || 0.0;

        const isAvailableVal = typeof data.isAvailable === 'boolean'
          ? data.isAvailable
          : (data.isAvailable === undefined || data.isAvailable?.toString().toLowerCase() === 'true' || data.isAvailable === 1 || data.isAvailable === '1');

        comboList.push({
          id: doc.id,
          name: data.name || 'Combo Promocional',
          description: data.description || '',
          productIds: Array.isArray(data.productIds) ? Array.from(data.productIds) : [],
          specialPrice: priceVal,
          imageUrl: data.imageUrl || getPlaceholderImage(data.name || 'Combo'),
          isAvailable: isAvailableVal,
        });
      });

      setCombos(comboList);
      setLoading(false);
    }, (error) => {
      console.warn("Firestore: Error al traer combos.", error);
      setLoading(false);
    });

    return () => {
      unsubProducts();
      unsubCombos();
    };
  }, []);

  // Abrir Modal y resetear cantidad
  const openComboDetail = (combo) => {
    setSelectedCombo(combo);
    setComboQuantity(1);
    setActiveImage('collage');
  };

  const increaseQuantity = () => setComboQuantity(prev => prev + 1);
  const decreaseQuantity = () => setComboQuantity(prev => prev > 1 ? prev - 1 : 1);

  // Simulación de añadir al carrito
  const handleAddComboToCart = (combo, qty) => {
    addToCart(combo, qty);
    setSelectedCombo(null);
  };

  return (
    <div className="space-y-10 animate-fadeIn text-left text-slate-100">
      
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 bg-rose-500/10 border border-rose-500/30 px-3 py-1 rounded-full text-xs font-semibold tracking-wider text-rose-450 uppercase mb-2">
            Descuentos Unicos
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
           COMBOS EXCLUSIVOS
          </h1>
          <p className="text-slate-400 text-sm mt-2 max-w-xl">
            Ahorra más comprando paquetes especialmente seleccionados para ti.</p>
        </div>
      </div>

      {/* ========================================================
          📦 GRID DE TARJETAS DE COMBOS (ADAPTACIÓN MULTIPANTALLA)
          ======================================================== */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[30vh] space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-rose-500 border-t-transparent" />
          <p className="text-slate-400 text-sm">Cargando promociones en tiempo real...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {combos.map((combo) => {
            const isComboOutOfStock = combo.isAvailable === false || (combo.productIds || []).some(pid => {
              const prodObj = products.find(p => p.id === pid);
              return !prodObj || prodObj.stock <= 0 || prodObj.isAvailable === false;
            });

            const originalPrice = (combo.productIds || []).reduce((sum, pid) => {
              const prodObj = products.find(p => p.id === pid);
              return sum + (prodObj ? prodObj.price : 0);
            }, 0);
            const savings = originalPrice > combo.specialPrice ? originalPrice - combo.specialPrice : 0;

            return (
              <div 
                key={combo.id}
                className="group bg-[#0e1017] border border-slate-800/80 rounded-[28px] p-5 shadow-xl hover:border-[#00d2ff]/35 hover:-translate-y-1 transition-all duration-300 flex flex-col relative cursor-pointer"
                onClick={() => openComboDetail(combo)}
              >
                <div className="flex justify-between items-start gap-4">
                  {/* Lado Izquierdo: Textos */}
                  <div className="flex-grow space-y-2 text-left pr-1">
                    <span className="inline-block px-3.5 py-1 bg-[#ff0055] text-white rounded-full text-[10px] font-black tracking-wider uppercase mb-1.5 font-sans">
                      {savings > 0 ? `AHORRAS $${savings.toFixed(2)}` : 'AHORRO EXTRA'}
                    </span>
                    <h3 className="text-lg sm:text-[19px] font-bold text-white line-clamp-2 group-hover:text-[#00d2ff] transition-colors leading-tight">
                      {combo.name}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed font-normal mt-1">
                      {combo.description}
                    </p>
                    
                    {/* Productos incluidos en la tarjeta */}
                    <div className="py-1 space-y-1">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#00d2ff]/80 block">
                        Incluye:
                      </span>
                      <div className="space-y-0.5">
                        {(combo.productIds || []).map((pid, idx) => {
                          const p = products.find(prod => prod.id === pid);
                          if (!p) return null;
                          return (
                            <div key={idx} className="flex items-center gap-1 text-[11px] text-slate-350">
                              <Check className="h-3 w-3 text-[#ff0055] shrink-0" />
                              <span className="truncate max-w-[150px] sm:max-w-xs">{p.name}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex items-baseline gap-2 pt-2">
                      <span className="text-2xl font-black text-[#00d2ff] font-sans">
                        ${combo.specialPrice.toFixed(2)}
                      </span>
                      {originalPrice > combo.specialPrice && (
                        <span className="text-xs text-slate-500 line-through font-mono">
                          ${originalPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Lado Derecho: Collage de Imágenes */}
                  <div className="w-[100px] h-[100px] sm:w-[110px] sm:h-[110px] flex-shrink-0 bg-slate-950/20 rounded-2xl overflow-hidden relative">
                    {isComboOutOfStock && (
                      <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-[2px] flex items-center justify-center z-20">
                        <span className="px-2 bg-red-650/90 text-white font-black text-[9px] uppercase tracking-widest rounded border border-red-500/30">
                          Agotado
                        </span>
                      </div>
                    )}
                    <ComboImageCollage 
                      productIds={combo.productIds} 
                      products={products} 
                      defaultImageUrl={combo.imageUrl}
                      className="w-full h-full"
                    />
                  </div>
                </div>

                {/* Botón Comprar Pack en la Base */}
                {isComboOutOfStock ? (
                  <button 
                    type="button"
                    disabled
                    className="mt-4 w-full py-3.5 bg-slate-800 text-slate-500 font-bold text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 cursor-not-allowed border-none"
                  >
                    <span>Agotado (Sin Stock)</span>
                  </button>
                ) : (
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation(); // Evita abrir el modal
                      handleAddComboToCart(combo, 1);
                    }}
                    className="mt-4 w-full py-3.5 bg-[#ff0055] hover:bg-[#ff0055]/95 text-white font-bold text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(255,0,85,0.35)] transition-all duration-300 cursor-pointer border-none"
                  >
                    <ShoppingCart className="h-4.5 w-4.5 stroke-[2.5]" />
                    <span>Comprar Pack</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================
          🔮 DIÁLOGO MODAL DETALLE DE COMBO (HIGH-FIDELITY OVERLAY)
          ======================================================== */}
      {selectedCombo && (() => {
        const isSelectedComboOutOfStock = selectedCombo.isAvailable === false || (selectedCombo.productIds || []).some(pid => {
          const prodObj = products.find(p => p.id === pid);
          return !prodObj || prodObj.stock <= 0 || prodObj.isAvailable === false;
        });

        const selectedComboOriginalPrice = (selectedCombo.productIds || []).reduce((sum, pid) => {
          const prodObj = products.find(p => p.id === pid);
          return sum + (prodObj ? prodObj.price : 0);
        }, 0);
        const selectedComboSavings = selectedComboOriginalPrice > selectedCombo.specialPrice 
          ? selectedComboOriginalPrice - selectedCombo.specialPrice 
          : 0;
        const savingsPercentage = selectedComboOriginalPrice > 0 
          ? Math.round((selectedComboSavings / selectedComboOriginalPrice) * 100) 
          : 0;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
            <div className="bg-[#0a0c10] border border-slate-800/80 rounded-3xl max-w-2xl w-full shadow-2xl shadow-[#00d2ff]/5 relative overflow-hidden transform scale-100 transition-all duration-300 max-h-[90vh] flex flex-col md:flex-row text-left animate-zoomIn">
              
              {/* Luces decorativas */}
              <div className="absolute top-0 right-0 w-36 h-36 bg-[#00d2ff]/5 rounded-full blur-3xl pointer-events-none" />
              
              {/* Botón de Cruz para Cerrar */}
              <button 
                onClick={() => setSelectedCombo(null)}
                className="absolute top-4 right-4 z-20 p-2 rounded-full bg-[#0a0c10]/60 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer focus:outline-none"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Lado Izquierdo: Visualización de Imagen Premium */}
              <div className="w-full md:w-1/2 h-64 md:h-auto bg-slate-950 relative overflow-hidden flex-shrink-0">
                {isSelectedComboOutOfStock && (
                  <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-[2px] flex items-center justify-center z-30">
                    <span className="px-4 py-2 bg-red-650/90 text-white font-black text-xs uppercase tracking-widest rounded-xl border border-red-500/30">
                      Agotado
                    </span>
                  </div>
                )}
                
                {activeImage === 'collage' ? (
                  <ComboImageCollage 
                    productIds={selectedCombo.productIds} 
                    products={products} 
                    defaultImageUrl={selectedCombo.imageUrl}
                    className="w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-950 p-6 animate-fadeIn relative">
                    <img 
                      src={activeImage} 
                      alt="Producto seleccionado" 
                      className="w-full h-full object-contain rounded-2xl"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent pointer-events-none" />
                  </div>
                )}

                {/* Miniaturas en la parte inferior */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-800/80 max-w-[90%] overflow-x-auto scrollbar-none shadow-lg">
                  {/* Miniatura del Collage (Pack) */}
                  <button 
                    type="button"
                    onClick={() => setActiveImage('collage')}
                    className={`flex-shrink-0 w-9 h-9 rounded-lg overflow-hidden border-2 transition-all flex flex-col items-center justify-center ${
                      activeImage === 'collage' 
                        ? 'border-[#ff0055] bg-[#ff0055]/20 shadow-[0_0_10px_rgba(255,0,85,0.4)]' 
                        : 'border-slate-700 hover:border-slate-500 bg-slate-950'
                    } cursor-pointer`}
                  >
                    <Gift className={`h-4 w-4 ${activeImage === 'collage' ? 'text-[#ff0055]' : 'text-slate-400'}`} />
                    <span className="text-[7px] font-black uppercase tracking-wider text-white mt-0.5">Pack</span>
                  </button>

                  {/* Miniatura de cada producto */}
                  {selectedCombo.productIds.map((pid, idx) => {
                    const p = products.find(prod => prod.id === pid);
                    if (!p) return null;
                    const pImg = p.imageUrl || getPlaceholderImage(p.name);
                    const isSelected = activeImage === pImg;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveImage(pImg)}
                        className={`flex-shrink-0 w-9 h-9 rounded-lg overflow-hidden border-2 transition-all ${
                          isSelected 
                            ? 'border-[#00d2ff] bg-[#00d2ff]/20 shadow-[0_0_10px_rgba(0,210,255,0.4)]' 
                            : 'border-slate-800 hover:border-slate-650'
                        } cursor-pointer`}
                      >
                        <img 
                          src={pImg} 
                          className="w-full h-full object-cover" 
                          alt={p.name} 
                        />
                      </button>
                    );
                  })}
                </div>

                <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#0a0c10]/95 via-transparent to-transparent pointer-events-none z-10" />
              </div>

              {/* Lado Derecho: Contenido de Especificaciones */}
              <div className="w-full md:w-1/2 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto max-h-[50vh] md:max-h-none space-y-6">
                
                {/* Textos Informativos */}
                <div className="space-y-4">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#ff0055] font-sans">
                    Descuento Ahorro Mayorista 
                  </span>
                  
                  <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white leading-tight">
                    {selectedCombo.name}
                  </h3>

                  <p className="text-xs text-slate-400 leading-relaxed font-normal">
                    {selectedCombo.description}
                  </p>

                  {/* Lista de productos incluidos en el Combo */}
                  <div className="space-y-2 pt-2 text-left">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Productos incluidos (Toca para ver foto):
                    </span>
                    <div className="space-y-2">
                      {selectedCombo.productIds.map((pid, idx) => {
                        const p = products.find(prod => prod.id === pid);
                        if (!p) return null;
                        const pImg = p.imageUrl || getPlaceholderImage(p.name);
                        const isActive = activeImage === pImg;
                        return (
                          <button 
                            key={idx} 
                            type="button"
                            onClick={() => setActiveImage(pImg)}
                            className={`w-full flex items-center space-x-3 text-left p-2 rounded-xl transition-all border ${
                              isActive 
                                ? 'bg-[#00d2ff]/10 border-[#00d2ff]/40 text-white shadow-[0_0_15px_rgba(0,210,255,0.1)]' 
                                : 'bg-slate-950/40 border-slate-900 text-slate-300 hover:bg-slate-900/50 hover:text-white'
                            } cursor-pointer`}
                          >
                            <img 
                              src={pImg} 
                              alt={p.name} 
                              className="w-8 h-8 rounded-lg object-cover bg-slate-900 border border-slate-800"
                            />
                            <div className="flex-grow min-w-0">
                              <div className="text-xs font-bold truncate">{p.name}</div>
                              <span className="text-[9px] text-[#00d2ff] uppercase tracking-wider block font-semibold mt-0.5">
                                {isActive ? 'Viendo imagen' : 'Ver detalle'}
                              </span>
                            </div>
                            <Check className={`h-4 w-4 flex-shrink-0 transition-all ${isActive ? 'text-[#00d2ff] scale-100' : 'text-slate-650 scale-0'}`} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Selector de cantidad y Adición */}
                <div className="space-y-4 border-t border-slate-900 pt-5">
                  
                  {/* Precios desglosados */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Combo Pack</span>
                    
                    <div className="text-right">
                      {selectedComboOriginalPrice > selectedCombo.specialPrice && (
                        <span className="text-[10px] text-slate-500 block line-through">
                          ${selectedComboOriginalPrice.toFixed(2)} (Valor individual)
                        </span>
                      )}
                      <span className="text-2xl font-black text-[#00d2ff] font-sans">
                        ${selectedCombo.specialPrice.toFixed(2)}
                      </span>
                      {selectedComboSavings > 0 && (
                        <span className="text-[10px] text-[#ff0055] font-semibold tracking-wider uppercase mt-0.5 block">
                          ¡Ahorras ${selectedComboSavings.toFixed(2)} ({savingsPercentage}%) en el pack!
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Selector de Cantidades */}
                  <div className={`flex items-center justify-between bg-[#0e1017] border border-slate-800 p-2 rounded-xl ${isSelectedComboOutOfStock ? 'opacity-50' : ''}`}>
                    <span className="text-xs font-bold text-slate-450 pl-2">Cantidad de Combos</span>
                    
                    <div className="flex items-center space-x-3">
                      <button
                        type="button"
                        disabled={isSelectedComboOutOfStock}
                        onClick={decreaseQuantity}
                        className="p-1.5 rounded-lg bg-[#0a0c10] border border-slate-850 text-slate-300 hover:text-white transition-all cursor-pointer focus:outline-none disabled:cursor-not-allowed"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      
                      <span className="font-mono text-sm font-bold w-6 text-center text-white">
                        {isSelectedComboOutOfStock ? 0 : comboQuantity}
                      </span>
                      
                      <button
                        type="button"
                        disabled={isSelectedComboOutOfStock}
                        onClick={increaseQuantity}
                        className="p-1.5 rounded-lg bg-[#0a0c10] border border-slate-850 text-slate-300 hover:text-white transition-all cursor-pointer focus:outline-none disabled:cursor-not-allowed"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Botón Final */}
                  {isSelectedComboOutOfStock ? (
                    <button
                      type="button"
                      disabled
                      className="w-full py-3.5 bg-slate-800 text-slate-500 font-bold text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 cursor-not-allowed border-none"
                    >
                      <span>Combo Agotado - Sin Existencias</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleAddComboToCart(selectedCombo, comboQuantity)}
                      className="w-full py-3.5 bg-[#ff0055] hover:bg-[#ff0055]/95 text-white font-bold text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(255,0,85,0.35)] transition-all duration-300 cursor-pointer border-none"
                    >
                      <ShoppingCart className="h-4.5 w-4.5 stroke-[2.5]" />
                      <span>Añadir Combo - ${(selectedCombo.specialPrice * comboQuantity).toFixed(2)}</span>
                    </button>
                  )}
                </div>

              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
