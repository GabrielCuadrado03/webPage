import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import { getPlaceholderImage } from '../../utils/placeholders';
import {
  Search,
  SlidersHorizontal,
  ShoppingBag,
  X,
  Info,
  Plus,
  Minus,
  Check,
  AlertTriangle,
  AlertCircle,
  ShoppingCart,
  ChevronLeft,
  Heart
} from 'lucide-react';

// No mock data definitions

export default function Products() {
  const { addToCart } = useCart();
  const { currentUser, userProfile, toggleFavorite } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Estados de carga de datos
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados de filtros y búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceOrder, setPriceOrder] = useState('none'); // 'none', 'asc', 'desc'
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  // Estado del Modal de Detalle de Producto
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [detailQuantity, setDetailQuantity] = useState(1);

  // Escuchar navegación externa con estado para abrir el modal del producto automáticamente
  useEffect(() => {
    if (location.state?.selectedProductId && products.length > 0) {
      const p = products.find(prod => prod.id === location.state.selectedProductId);
      if (p) {
        setSelectedProduct(p);
        setDetailQuantity(1);
        // Limpiar el estado de navegación para evitar reabrir al refrescar
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, products]);

  // Escuchar cambio de categoría desde el estado de navegación externa
  useEffect(() => {
    if (location.state?.selectedCategoryId) {
      setSelectedCategory(location.state.selectedCategoryId);
      // Limpiar el estado de navegación para evitar fijar la categoría
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Escuchar cambio de categoría en tiempo real si ya estamos dentro del catálogo
  useEffect(() => {
    const handleCategoryEvent = (e) => {
      if (e.detail) {
        setSelectedCategory(e.detail);
      }
    };
    window.addEventListener('categoryFilterChanged', handleCategoryEvent);
    return () => {
      window.removeEventListener('categoryFilterChanged', handleCategoryEvent);
    };
  }, []);


  // Conexión real-time con Firestore
  useEffect(() => {
    setLoading(true);

    // 1. Escuchar Categorías en tiempo real
    const unsubCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
      const catList = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        catList.push({
          id: doc.id,
          name: data.name || 'Categoría',
          imageUrl: data.imageUrl || getPlaceholderImage(data.name || 'Categoría'),
        });
      });

      setCategories(catList);
    }, (error) => {
      console.warn("Firestore: Error al traer categorías", error);
      setCategories([]);
    });

    // 2. Escuchar Productos en tiempo real con Parseo Ultra-Seguro de Flutter
    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const prodList = [];
      snapshot.forEach((doc) => {
        const data = doc.data();

        // PARSEO DEFENSIVO EXTREMO (IDÉNTICO A FIREBASESERVICE EN FLUTTER)
        const priceRaw = data.price;
        const priceVal = typeof priceRaw === 'number'
          ? priceRaw
          : parseFloat(priceRaw?.toString() || '') || 0.0;

        const stockRaw = data.stock;
        const stockVal = typeof stockRaw === 'number'
          ? stockRaw
          : parseInt(stockRaw?.toString() || '') || 0;

        const discountRaw = data.userDiscount !== undefined ? data.userDiscount : data.discount;
        const discountVal = typeof discountRaw === 'number'
          ? discountRaw
          : parseFloat(discountRaw?.toString() || '') || 0.0;

        const isFeaturedVal = typeof data.isFeatured === 'boolean'
          ? data.isFeatured
          : (data.isFeatured?.toString().toLowerCase() === 'true' || data.isFeatured === 1 || data.isFeatured === '1');

        const isAvailableVal = typeof data.isAvailable === 'boolean'
          ? data.isAvailable
          : (data.isAvailable === undefined || data.isAvailable?.toString().toLowerCase() === 'true' || data.isAvailable === 1 || data.isAvailable === '1');

        prodList.push({
          id: doc.id,
          name: data.name || 'Producto sin nombre',
          description: data.description || '',
          price: priceVal,
          imageUrl: data.imageUrl || getPlaceholderImage(data.name || 'Producto'),
          categoryId: data.categoryId || 'default',
          stock: stockVal,
          userDiscount: discountVal,
          discount: discountVal,
          isFeatured: isFeaturedVal,
          isAvailable: isAvailableVal && stockVal > 0, // Disponible si está habilitado y stock > 0
        });
      });

      setProducts(prodList);
      setLoading(false);
    }, (error) => {
      console.warn("Firestore: Error al traer productos", error);
      setProducts([]);
      setLoading(false);
    });

    return () => {
      unsubCategories();
      unsubProducts();
    };
  }, []);

  // Lógica de Filtros y Búsqueda combinada
  const filteredProducts = products
    .filter((p) => {
      // Filtro de búsqueda por nombre o descripción
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());

      // Filtro de categoría
      const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;

      // Filtro de stock disponible
      const matchesAvailability = !onlyAvailable || p.stock > 0;

      return matchesSearch && matchesCategory && matchesAvailability;
    })
    .sort((a, b) => {
      // Ordenamiento por precio
      const priceA = a.price * (1 - a.userDiscount / 100);
      const priceB = b.price * (1 - b.userDiscount / 100);

      if (priceOrder === 'asc') return priceA - priceB;
      if (priceOrder === 'desc') return priceB - priceA;
      return 0; // Sin ordenamiento
    });

  // Funciones de control del selector de cantidad en el Modal
  const increaseQuantity = () => {
    if (selectedProduct) {
      if (detailQuantity < selectedProduct.stock) {
        setDetailQuantity(detailQuantity + 1);
      } else {
        alert(`Solo tenemos ${selectedProduct.stock} unidades disponibles actualmente. Ajusta la cantidad para continuar.`);
      }
    }
  };

  const decreaseQuantity = () => {
    if (detailQuantity > 1) {
      setDetailQuantity(detailQuantity - 1);
    }
  };

  // Abrir Modal Detalle y resetear cantidad
  const openProductDetail = (product) => {
    setSelectedProduct(product);
    setDetailQuantity(1);
  };

  // Añadir al carrito real
  const handleAddToCart = (product, qty) => {
    addToCart(product, qty);
    setSelectedProduct(null);
  };

  const handleToggleFavorite = async (productId) => {
    if (!currentUser) {
      if (window.confirm('Debes iniciar sesión para guardar favoritos. ¿Deseas iniciar sesión ahora?')) {
        setSelectedProduct(null);
        navigate('/auth/login');
      }
      return;
    }
    try {
      await toggleFavorite(productId);
    } catch (error) {
      console.error("Error al guardar favorito: ", error);
      alert("No se pudo guardar en favoritos.");
    }
  };

  const favoriteProductIds = userProfile?.favoriteProductIds || [];
  const isFavorite = selectedProduct ? favoriteProductIds.includes(selectedProduct.id) : false;

  return (
    <div className="space-y-10 animate-fadeIn text-left text-slate-100">

      {/* Encabezado Principal */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/30 px-3 py-1 rounded-full text-xs font-semibold tracking-wider text-indigo-400 uppercase mb-2">
            Catálogo 
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            NUESTROS PRODUCTOS
          </h1>
          <p className="text-slate-400 text-sm mt-2 max-w-xl">
            Explora nuestro catálogo completo y encuentra el producto perfecto para ti.
          </p>
        </div>
        {/* No mock data banner */}
      </div>

      {/* ========================================================
          🔍 BARRA DE BÚSQUEDA Y CONTROLES DE FILTROS (MOBILE-FIRST)
          ======================================================== */}
      <div className="bg-[#0b0c12]/60 border border-slate-800/60 rounded-3xl p-6 space-y-6 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#00d2ff]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Buscador de texto */}
          <div className="md:col-span-6 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
              <Search className="h-5 w-5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="¿Qué estás buscando hoy?"
              className="w-full pl-11 pr-4 h-11 bg-slate-950/60 border border-slate-800/80 rounded-2xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#00d2ff] focus:ring-1 focus:ring-[#00d2ff]/30 transition-all text-sm font-medium"
            />
          </div>

          {/* Selector de ordenamiento de precios */}
          <div className="md:col-span-3 relative">
            <select
              value={priceOrder}
              onChange={(e) => setPriceOrder(e.target.value)}
              className="w-full pl-4 pr-10 h-11 bg-slate-950/60 border border-slate-800/80 rounded-2xl text-slate-300 focus:outline-none focus:border-[#00d2ff] focus:ring-1 focus:ring-[#00d2ff]/30 transition-all text-sm appearance-none cursor-pointer font-medium"
            >
              <option value="none">Destacado</option>
              <option value="asc">Precio: Menor a Mayor</option>
              <option value="desc">Precio: Mayor a Menor</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-500">
              <SlidersHorizontal className="h-4 w-4" />
            </div>
          </div>

          {/* Switch de disponibilidad de stock */}
          <div className="md:col-span-3 flex items-center justify-between md:justify-end gap-3 px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 select-none">Productos en stock</span>
            <button
              onClick={() => setOnlyAvailable(!onlyAvailable)}
              className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-300 focus:outline-none cursor-pointer relative ${onlyAvailable ? 'bg-gradient-to-r from-[#00d2ff] to-[#0080ff]' : 'bg-slate-950 border border-slate-850'}`}
            >
              <div className={`w-4.5 h-4.5 rounded-full bg-white transition-transform duration-300 shadow-sm ${onlyAvailable ? 'transform translate-x-5' : 'transform translate-x-0'}`} />
            </button>
          </div>
        </div>

        {/* Selector de Categorías (Horizontal Dinámico con Imágenes) */}
        <div className="space-y-3 border-t border-slate-850/60 pt-5 text-left">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Filtrar por Categoría</span>

          <div className="flex flex-wrap gap-2.5">
            {/* Categoría: Todos */}
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider border transition-all duration-300 cursor-pointer ${
                selectedCategory === 'all' 
                  ? 'bg-gradient-to-r from-[#00d2ff] to-[#0090ff] text-slate-950 border-transparent shadow-[0_0_15px_rgba(0,210,255,0.25)] font-extrabold scale-102' 
                  : 'bg-slate-950/50 border border-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-900/60 hover:border-slate-700'
              }`}
            >
              Todos
            </button>

            {/* Categorías cargadas */}
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider border transition-all duration-300 cursor-pointer flex items-center space-x-2 ${
                  selectedCategory === c.id 
                    ? 'bg-gradient-to-r from-[#00d2ff] to-[#0090ff] text-slate-950 border-transparent shadow-[0_0_15px_rgba(0,210,255,0.25)] font-extrabold scale-102' 
                    : 'bg-slate-950/50 border border-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <span>{c.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================
          📦 GRID DE TARJETAS DE PRODUCTOS (ADAPTACIÓN MULTIPANTALLA)
          ======================================================== */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[30vh] space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-500 border-t-transparent" />
          <p className="text-slate-400 text-sm">Cargando catálogo en tiempo real...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center bg-slate-900/20 border border-slate-800/80 rounded-3xl py-16 px-4 max-w-lg mx-auto space-y-4">
          <AlertCircle className="h-12 w-12 text-slate-500 mx-auto" />
          <h3 className="text-xl font-bold text-slate-350">No se encontraron productos</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">
            Ningún producto coincide con la búsqueda o filtros aplicados actualmente. 
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setPriceOrder('none');
              setOnlyAvailable(false);
            }}
            className="cursor-pointer"
          >
            Limpiar Filtros
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((p) => {
            const discountPercent = currentUser
              ? (p.userDiscount !== undefined ? p.userDiscount : (p.discount || 0))
              : 0;
            const hasDiscount = discountPercent > 0;
            const discountedPrice = hasDiscount ? p.price * (1 - discountPercent / 100) : p.price;
            const isOutOfStock = p.stock === 0;

            return (
              <div
                key={p.id}
                className="group glass-card rounded-3xl overflow-hidden hover:-translate-y-1.5 flex flex-col relative cursor-pointer hover:shadow-[0_0_20px_rgba(0,210,255,0.1)] transition-all duration-500"
                onClick={() => openProductDetail(p)}
              >
                {/* Badge de Descuento */}
                {hasDiscount && (
                  <span className="absolute top-3.5 right-3.5 z-10 px-3.5 py-1.5 bg-[#f43f5e] rounded-full text-xs sm:text-sm font-black text-white shadow-lg shadow-[#f43f5e]/30 tracking-wider">
                    -{discountPercent}%
                  </span>
                )}

                {/* Badge de Agotado */}
                {isOutOfStock && (
                  <div className="absolute inset-0 bg-slate-950/80 z-10 flex items-center justify-center backdrop-blur-xs">
                    <span className="px-3 py-1.5 bg-[#be123c] border border-[#f43f5e] rounded-xl text-[10px] font-bold tracking-widest uppercase text-white shadow-lg">
                      Agotado
                    </span>
                  </div>
                )}

                {/* Contenedor Imagen */}
                <div className="h-44 sm:h-48 overflow-hidden bg-slate-950 relative flex items-center justify-center">
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 opacity-80 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-slate-950/10 to-transparent pointer-events-none" />
                </div>

                {/* Cuerpo de la Tarjeta (Compacto) */}
                <div className="p-3.5 flex flex-col justify-between flex-grow bg-slate-950/30">
                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-white tracking-wide truncate group-hover:text-[#00d2ff] transition-colors text-left" title={p.name}>
                      {p.name}
                    </h3>

                    {/* Precios y Botón de Compra */}
                    <div className="flex items-center justify-between pt-0.5">
                      <div>
                        {hasDiscount ? (
                          <div className="flex flex-col text-left leading-none">
                            <span className="text-xs text-slate-500 line-through font-mono mb-0.5">${p.price.toFixed(2)}</span>
                            <span className="text-base font-extrabold text-[#f43f5e] font-mono">${discountedPrice.toFixed(2)}</span>
                          </div>
                        ) : (
                          <span className="text-base font-extrabold text-[#00d2ff] font-mono">${p.price.toFixed(2)}</span>
                        )}
                      </div>

                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={(e) => {
                          e.stopPropagation(); // Evita abrir el modal al clickear el botón directamente
                          handleAddToCart(p, 1);
                        }}
                        className="w-8.5 h-8.5 rounded-full bg-[#f43f5e]/10 hover:bg-[#f43f5e] border border-[#f43f5e]/25 hover:border-[#f43f5e] text-[#f43f5e] hover:text-white flex items-center justify-center transition-all duration-300 disabled:opacity-20 cursor-pointer shadow-sm hover:shadow-[#f43f5e]/20"
                      >
                        <Plus className="h-4 w-4 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================
          🔮 DIÁLOGO MODAL DETALLE DE PRODUCTO (HIGH-FIDELITY OVERLAY)
          ======================================================== */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#05060e] border border-slate-900 rounded-[32px] max-w-md w-full shadow-2xl shadow-black/80 relative overflow-hidden transform scale-100 transition-all duration-300 max-h-[92vh] flex flex-col text-left">

            {/* 1. Contenedor de Imagen de Cabecera (Alto) */}
            <div className="relative w-full h-80 sm:h-96 flex-shrink-0 bg-slate-950">
              <img
                src={selectedProduct.imageUrl}
                alt={selectedProduct.name}
                className="w-full h-full object-cover opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#05060e] via-[#05060e]/30 to-transparent pointer-events-none" />

              {/* Acciones de Cabecera */}
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-6 left-6 z-20 p-2.5 rounded-full bg-slate-950/50 border border-slate-800/40 text-white hover:bg-slate-900/60 hover:scale-105 active:scale-95 transition-all cursor-pointer focus:outline-none"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>

              <button
                onClick={() => handleToggleFavorite(selectedProduct.id)}
                className="absolute top-6 right-6 z-20 p-2.5 rounded-full bg-slate-950/50 border border-slate-800/40 text-white hover:bg-slate-900/60 hover:scale-105 active:scale-95 transition-all cursor-pointer focus:outline-none"
                title={isFavorite ? "Eliminar de favoritos" : "Guardar en favoritos"}
              >
                <Heart className={`h-6 w-6 transition-all duration-300 ${isFavorite ? 'fill-[#f43f5e] text-[#f43f5e] drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 'text-white hover:text-[#f43f5e]'}`} />
              </button>

              {/* Badge de Descuento */}
              {(currentUser && (selectedProduct.userDiscount > 0 || selectedProduct.discount > 0)) && (
                <span className="absolute top-6 right-20 z-10 px-3.5 py-1.5 bg-[#f43f5e] rounded-full text-xs sm:text-sm font-black text-white shadow-lg shadow-[#f43f5e]/30 tracking-wider">
                  -{selectedProduct.userDiscount || selectedProduct.discount}%
                </span>
              )}
            </div>

            {/* 2. Área de Contenido Desplazable */}
            <div className="p-6 space-y-6 overflow-y-auto flex-grow text-left">

              {/* Título y Precio en la misma línea */}
              <div className="flex justify-between items-start gap-4">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                  {selectedProduct.name}
                </h3>
                {(currentUser && (selectedProduct.userDiscount > 0 || selectedProduct.discount > 0)) ? (
                  <div className="flex flex-col text-right shrink-0">
                    <span className="text-sm text-slate-500 line-through font-mono mb-0.5">${selectedProduct.price.toFixed(2)}</span>
                    <span className="text-2xl sm:text-3xl font-black text-[#f43f5e] font-mono tracking-tight">
                      ${(selectedProduct.price * (1 - (selectedProduct.userDiscount || selectedProduct.discount) / 100)).toFixed(2)}
                    </span>
                  </div>
                ) : (
                  <span className="text-2xl sm:text-3xl font-black text-[#00d2ff] font-mono tracking-tight shrink-0">
                    ${selectedProduct.price.toFixed(2)}
                  </span>
                )}
              </div>

              {/* Badge de Stock */}
              <div>
                <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${selectedProduct.stock > 0 ? 'bg-[#00d2ff]/10 border border-[#00d2ff]/30 text-[#00d2ff]' : 'bg-red-500/10 border border-red-500/30 text-red-500'}`}>
                  {selectedProduct.stock > 0 ? 'En Stock' : 'Agotado'}
                </span>
              </div>

              {/* Descripción */}
              <div className="space-y-2">
                <h4 className="text-base font-bold text-white tracking-wide uppercase">
                  Descripción
                </h4>
                <p className="text-sm text-slate-400 font-normal leading-relaxed">
                  {selectedProduct.description || 'Sin descripción disponible para este producto premium.'}
                </p>
              </div>

              {/* Cantidad con Selector en Caja */}
              {selectedProduct.stock > 0 && (
                <div className="flex items-center justify-between bg-slate-900/30 border border-slate-900/60 p-4 rounded-2xl">
                  <span className="text-base font-bold text-white">Cantidad</span>

                  <div className="flex items-center space-x-4 bg-slate-950 border border-slate-850 px-4 py-2 rounded-xl">
                    <button
                      type="button"
                      onClick={decreaseQuantity}
                      className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-slate-900/60 transition-all cursor-pointer focus:outline-none"
                    >
                      <Minus className="h-4.5 w-4.5" />
                    </button>

                    <span className="font-mono text-base font-bold w-6 text-center text-white">
                      {detailQuantity}
                    </span>

                    <button
                      type="button"
                      onClick={increaseQuantity}
                      className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-slate-900/60 transition-all cursor-pointer focus:outline-none"
                    >
                      <Plus className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Barra Sticky de Acción en la Base */}
            <div className="p-5 bg-slate-900/90 border-t border-slate-850/60 backdrop-blur-md flex items-center justify-between gap-6 rounded-b-[32px] flex-shrink-0">
              <div className="text-left shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">Total Price</span>
                <span className={`text-2xl font-black font-mono tracking-tight ${(currentUser && (selectedProduct.userDiscount > 0 || selectedProduct.discount > 0)) ? 'text-[#f43f5e] glow-text-cherry' : 'text-[#00d2ff] glow-text-cyan'}`}>
                  ${(selectedProduct.price * (1 - (currentUser ? (selectedProduct.userDiscount || selectedProduct.discount || 0) : 0) / 100) * detailQuantity).toFixed(2)}
                </span>
              </div>

              <div className="flex-grow flex justify-end">
                {selectedProduct.stock > 0 ? (
                  <button
                    type="button"
                    onClick={() => handleAddToCart(selectedProduct, detailQuantity)}
                    className="w-full max-w-[220px] py-4 px-6 bg-[#00d2ff] hover:bg-[#00d2ff]/90 text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 hover:shadow-[0_0_25px_rgba(0,210,255,0.45)] transition-all duration-300 cursor-pointer border-none"
                  >
                    <ShoppingCart className="h-4.5 w-4.5 stroke-[2.5]" />
                    <span>Añadir al Carrito</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="w-full max-w-[220px] py-4 px-6 bg-slate-800/80 text-slate-500 font-black text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 border border-slate-850"
                  >
                    <AlertCircle className="h-4.5 w-4.5" />
                    <span>Sin Stock</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
