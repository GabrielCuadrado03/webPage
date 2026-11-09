import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { db } from '../config/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import Button from '../components/Button';
import Login from '../modules/auth/Login';
import Register from '../modules/auth/Register';
import ForgotPassword from '../modules/auth/ForgotPassword';
import Products from '../modules/products/Products';
import Combos from '../modules/combos/Combos';
import Cart from '../modules/cart/Cart';
import Profile from '../modules/auth/Profile';
import AdminDashboard from '../modules/admin/AdminDashboard';
import { getPlaceholderImage } from '../utils/placeholders';
import { 
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  Plus,
  Heart,
  Minus,
  AlertCircle,
  X,
  Gift,
  Check
} from 'lucide-react';

// ========================================================
// 🎁 COMPONENTE PREMIUM DE COLLAGE PARA COMBOS (igual que Combos.jsx)
// ========================================================
const ComboImageCollage = ({ productIds, products, defaultImageUrl, className = "" }) => {
  const images = (productIds || [])
    .map(pid => {
      const p = products.find(prod => prod.id === pid);
      return p?.imageUrl || null;
    })
    .filter(Boolean);

  const uniqueImages = [...new Set(images)];

  if (uniqueImages.length === 0) {
    return (
      <div className={`w-full h-full relative overflow-hidden bg-slate-950 ${className}`}>
        <img 
          src={defaultImageUrl || getPlaceholderImage('Combo')} 
          alt="Combo default" 
          className="w-full h-full object-cover opacity-90"
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

// ========================================================
// 🏠 COMPONENTE PREMIUM DE LA PÁGINA DE INICIO (HOME)
// ========================================================
const Home = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { currentUser, userProfile, toggleFavorite } = useAuth();

  // Productos destacados dinámicos desde Firestore o mocks
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [combos, setCombos] = useState([]);

  // Estado del Modal de Detalle de Producto
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [detailQuantity, setDetailQuantity] = useState(1);

  // Estado del Modal de Detalle de Combo
  const [selectedCombo, setSelectedCombo] = useState(null);
  const [comboQuantity, setComboQuantity] = useState(1);
  const [activeComboImage, setActiveComboImage] = useState('collage');

  const openComboDetail = (combo) => {
    setSelectedCombo(combo);
    setComboQuantity(1);
    setActiveComboImage('collage');
  };

  const increaseComboQuantity = () => setComboQuantity(prev => prev + 1);
  const decreaseComboQuantity = () => setComboQuantity(prev => prev > 1 ? prev - 1 : 1);

  // Funciones de control del selector de cantidad en el Modal
  const openProductDetail = (product) => {
    setSelectedProduct(product);
    setDetailQuantity(1);
  };

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

  const handleAddToCart = (product, qty) => {
    addToCart(product, qty);
    setSelectedProduct(null);
  };

  const favoriteProductIds = userProfile?.favoriteProductIds || [];
  const isFavorite = selectedProduct ? favoriteProductIds.includes(selectedProduct.id) : false;

  // Estados de Banners
  const [banners, setBanners] = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [loadingBanners, setLoadingBanners] = useState(true);

  // Escuchar Banners desde Firestore en tiempo real
  useEffect(() => {
    const unsubBanners = onSnapshot(collection(db, 'banners'), (snapshot) => {
      const bannerList = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        bannerList.push({
          id: doc.id,
          title: data.title || 'Ethereal Vapes',
          subtitle: data.subtitle || 'Esfera Premium',
          description: data.description || '',
          imageUrl: data.imageUrl || getPlaceholderImage('Banner'),
          linkText: data.linkText || 'Ver Más',
          linkUrl: data.linkUrl || '/products'
        });
      });

      setBanners(bannerList);
      setLoadingBanners(false);
    }, (error) => {
      console.warn("Firestore: Error al traer banners", error);
      setBanners([]);
      setLoadingBanners(false);
    });

    return () => unsubBanners();
  }, []);

  // Escuchar Productos desde Firestore en tiempo real para el Showcase Destacado
  useEffect(() => {
    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const prodList = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data) {
          const discountRaw = data.userDiscount !== undefined ? data.userDiscount : data.discount;
          const discountVal = typeof discountRaw === 'number' 
            ? discountRaw 
            : parseFloat(discountRaw?.toString() || '') || 0.0;

          prodList.push({
            id: doc.id,
            name: data.name || 'Producto sin nombre',
            category: data.categoryId || 'General',
            price: typeof data.price === 'number' ? data.price : parseFloat(data.price?.toString()) || 0.0,
            discount: discountVal,
            userDiscount: discountVal,
            imageUrl: data.imageUrl || getPlaceholderImage(data.name || 'Producto'),
            rating: 5.0, // Calificación premium por defecto
            isFeatured: !!data.isFeatured,
            isAvailable: data.isAvailable !== false,
            stock: typeof data.stock === 'number' ? data.stock : parseInt(data.stock?.toString()) || 0
          });
        }
      });

      setProducts(prodList); // Conservar todos los productos

      // Filtrar todos los productos destacados (incluyendo los que estén temporalmente sin stock)
      const featured = prodList.filter(p => p.isFeatured);
      if (featured.length > 0) {
        setFeaturedProducts(featured);
      } else {
        // Fallback: mostrar los primeros 6 productos
        setFeaturedProducts(prodList.slice(0, 6));
      }
    }, (error) => {
      console.warn("Firestore: Error al traer productos en Home.", error);
    });

    return () => unsubProducts();
  }, []);

  // Escuchar Combos desde Firestore en tiempo real para el Showcase de Combos en Inicio
  useEffect(() => {
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

      setCombos(comboList.filter(c => c.isAvailable));
    }, (error) => {
      console.warn("Firestore: Error al traer combos en Home.", error);
    });

    return () => unsubCombos();
  }, []);

  // Rotación Automática del Slider (Cada 6 segundos)
  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % banners.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [banners]);

  // Controles Manuales del Slider
  const nextSlide = (e) => {
    e.stopPropagation();
    setActiveIdx((prev) => (prev + 1) % banners.length);
  };

  const prevSlide = (e) => {
    e.stopPropagation();
    setActiveIdx((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const activeBanner = banners[activeIdx] || null;

  return (
    <div className="space-y-20 animate-fadeIn">
      
      {/* ========================================================
          🔮 SECCIÓN HERO: REJILLA CON MARCA Y CARRUSEL
          ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
        
        {/* Tarjeta de Marca (Lado Izquierdo) */}
        <div className="hidden lg:flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 text-center relative overflow-hidden shadow-2xl group min-h-[450px] sm:min-h-[500px] lg:min-h-[550px]">
          {/* Luces neón de fondo */}
          <div className="absolute -top-10 -left-10 w-28 h-28 bg-[#ff0055]/5 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -right-10 w-28 h-28 bg-[#00d2ff]/5 rounded-full blur-2xl pointer-events-none" />
          
          {/* Logo Circular Grande */}
          <div className="relative w-40 h-40 rounded-full overflow-hidden border border-[#00d2ff]/40 shadow-[0_0_25px_rgba(0,210,255,0.35)] bg-[#05060b] flex items-center justify-center p-1 group-hover:scale-103 transition-transform duration-500">
            <img src="/images/logo.png" alt="Ethereal Vapes Logo" className="w-full h-full object-contain" />
          </div>
          
          {/* Texto de la Marca */}
          <h2 className="text-2xl font-black tracking-widest mt-8 bg-gradient-to-r from-white via-slate-100 to-slate-450 bg-clip-text text-transparent uppercase font-sans">
            ETHEREAL
          </h2>
          <span className="text-sm font-bold tracking-[0.25em] text-[#00d2ff] uppercase font-sans mt-1">
            VAPES
          </span>
          <p className="text-[9px] text-slate-500 font-extrabold uppercase tracking-[0.3em] mt-6 border-t border-slate-800/60 pt-4 w-full">
            Premium Experience
          </p>
        </div>

        {/* Carrusel de Banners (Lado Derecho) */}
        <div className="lg:col-span-3">
          {activeBanner && (
            <section className="relative rounded-3xl overflow-hidden bg-slate-950 border border-slate-800/50 shadow-2xl h-[450px] sm:h-[500px] lg:h-[550px] group h-full">
            
            {/* Imagen de Fondo del Slider con Transición */}
            <div className="absolute inset-0 z-0">
              <img 
                src={activeBanner.imageUrl} 
                alt={activeBanner.title}
                className="w-full h-full object-cover opacity-85 group-hover:scale-103 transition-all duration-[2000ms] ease-out"
              />
              {/* Degradados optimizados para lectura impecable a la izquierda y realce a la derecha */}
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/50 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent" />
            </div>

            {/* Efectos de luces decorativos */}
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-3xl pointer-events-none z-10" />
            <div className="absolute bottom-0 left-0 w-[250px] h-[250px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none z-10" />

            {/* Contenedor del Slide Activo */}
            <div className="relative z-20 h-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-20 flex items-center justify-start">
              <div className="max-w-xl space-y-6 text-left animate-fadeIn">
                
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-none bg-gradient-to-r from-white via-slate-100 to-purple-350 bg-clip-text text-transparent uppercase">
                  {activeBanner.title} <br />
                  <span className="text-xl sm:text-2xl font-bold tracking-widest bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent block mt-2 uppercase">
                    {activeBanner.subtitle}
                  </span>
                </h1>
                
                <p className="text-slate-400 text-sm sm:text-base leading-relaxed font-normal">
                  {activeBanner.description}
                </p>
                
                <div className="pt-2">
                  <Link to={activeBanner.linkUrl}>
                    <Button variant="primary" size="lg" className="shadow-lg shadow-purple-500/20 font-bold">
                      {activeBanner.linkText}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* ========================================================
                CONTROLES CHEVRONS DE SLIDER (OVERLAYS)
                ======================================================== */}
            {banners.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-xl bg-slate-950/40 border border-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-900 transition-all cursor-pointer opacity-0 group-hover:opacity-100 focus:outline-none"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-xl bg-slate-950/40 border border-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-900 transition-all cursor-pointer opacity-0 group-hover:opacity-100 focus:outline-none"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}

            {/* ========================================================
                CONTROLES DOT INDICATORS DE SLIDER
                ======================================================== */}
            {banners.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex space-x-2.5">
                {banners.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveIdx(idx);
                    }}
                    className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${activeIdx === idx ? 'bg-purple-500 w-6' : 'bg-slate-700 hover:bg-slate-500'}`}
                  />
                ))}
              </div>
            )}
          </section>
          )}
        </div>
      </div>


      {/* Combos Especiales Showcase (Solo para usuarios registrados en lugar de las características) */}
      {currentUser && combos.length > 0 && (
        <section className="space-y-8 text-left mt-4 mb-8">
          <div className="flex justify-between items-end">
            <div className="flex items-center space-x-2">
              <span className="text-[#ff0055] text-xl">✨</span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#ff0055]">Ahorro Asegurado</p>
                <h2 className="text-3xl font-extrabold tracking-tight mt-1 text-white">Combos Especiales</h2>
              </div>
            </div>
            <Link to="/combos" className="text-sm font-bold text-[#ff0055] hover:text-[#ff0055]/80 transition-colors">
              Ver todos los combos &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {combos.slice(0, 2).map((combo) => {
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
                  onClick={() => openComboDetail(combo)}
                  className="group bg-[#0e1017] border border-slate-800/80 rounded-[28px] p-5 shadow-xl hover:border-[#00d2ff]/35 hover:-translate-y-1 transition-all duration-300 flex flex-col relative cursor-pointer"
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

                      {/* Productos incluidos en la tarjeta en Home */}
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
                        e.stopPropagation(); // Evita navegar a combos
                        addToCart(combo, 1);
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
        </section>
      )}

      {/* Catálogo Showcase Rápido de Bienvenida (Verificación Visual) */}
      <section className="space-y-8 text-left">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-purple-400">Selección Especial</p>
            <h2 className="text-3xl font-extrabold tracking-tight mt-1 text-white">Productos Destacados</h2>
          </div>
          <Link to="/products" className="text-sm font-bold text-purple-400 hover:text-purple-300 transition-colors">
            Ver catálogo completo &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredProducts.map((p) => {
            const hasDiscount = currentUser && p.discount > 0;
            const discountedPrice = hasDiscount ? p.price * (1 - p.discount / 100) : p.price;
            const isOutOfStock = p.stock <= 0 || p.isAvailable === false;

            return (
              <div 
                key={p.id}
                onClick={() => openProductDetail(p)}
                className="group glass-card rounded-3xl overflow-hidden hover:-translate-y-1.5 flex flex-col relative cursor-pointer hover:shadow-[0_0_20px_rgba(0,210,255,0.1)] transition-all duration-500"
              >
                {/* Badge de Descuento */}
                {hasDiscount && (
                  <span className="absolute top-3.5 right-3.5 z-10 px-3.5 py-1.5 bg-[#f43f5e] rounded-full text-xs sm:text-sm font-black text-white shadow-lg shadow-[#f43f5e]/30 tracking-wider">
                    -{p.discount}%
                  </span>
                )}

                {/* Contenedor Imagen */}
                <div className="h-44 sm:h-48 overflow-hidden bg-slate-950 relative flex items-center justify-center">
                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-[2px] flex items-center justify-center z-10">
                      <span className="px-3 py-1 bg-red-650/90 text-white font-black text-2xs uppercase tracking-widest rounded-lg border border-red-500/30">
                        Agotado
                      </span>
                    </div>
                  )}
                  <img 
                    src={p.imageUrl} 
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 opacity-80 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-slate-950/10 to-transparent pointer-events-none" />
                </div>

                {/* Cuerpo de la tarjeta (Compacto) */}
                <div className="p-3.5 flex flex-col justify-between flex-grow bg-slate-950/30">
                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-white tracking-wide truncate group-hover:text-[#00d2ff] transition-colors text-left" title={p.name}>
                      {p.name}
                    </h3>

                    {/* Precios y Botón */}
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

                      {isOutOfStock ? (
                        <span className="text-[10px] font-black uppercase tracking-wider text-red-400 bg-red-500/10 px-2 py-1 rounded-md border border-red-500/25">
                          Sin Stock
                        </span>
                      ) : (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(p, 1);
                          }}
                          className="w-8.5 h-8.5 rounded-full bg-[#f43f5e]/10 hover:bg-[#f43f5e] border border-[#f43f5e]/25 hover:border-[#f43f5e] text-[#f43f5e] hover:text-white flex items-center justify-center transition-all duration-300 cursor-pointer shadow-sm hover:shadow-[#f43f5e]/20"
                        >
                          <Plus className="h-4 w-4 stroke-[2.5]" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Combos movidos a la parte superior */}

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
                      <Minus className="h-4.5 w-4.5 text-slate-400" />
                    </button>
                    
                    <span className="font-mono text-base font-bold w-6 text-center text-white">
                      {detailQuantity}
                    </span>
                    
                    <button
                      type="button"
                      onClick={increaseQuantity}
                      className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-slate-900/60 transition-all cursor-pointer focus:outline-none"
                    >
                      <Plus className="h-4.5 w-4.5 text-slate-400" />
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

      {/* ========================================================
          🔮 DIÁLOGO MODAL DETALLE DE COMBO (HOME OVERLAY)
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
                
                {activeComboImage === 'collage' ? (
                  <ComboImageCollage 
                    productIds={selectedCombo.productIds} 
                    products={products} 
                    defaultImageUrl={selectedCombo.imageUrl}
                    className="w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-950 p-6 animate-fadeIn relative">
                    <img 
                      src={activeComboImage} 
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
                    onClick={() => setActiveComboImage('collage')}
                    className={`flex-shrink-0 w-9 h-9 rounded-lg overflow-hidden border-2 transition-all flex flex-col items-center justify-center ${
                      activeComboImage === 'collage' 
                        ? 'border-[#ff0055] bg-[#ff0055]/20 shadow-[0_0_10px_rgba(255,0,85,0.4)]' 
                        : 'border-slate-700 hover:border-slate-500 bg-slate-950'
                    } cursor-pointer`}
                  >
                    <Gift className={`h-4 w-4 ${activeComboImage === 'collage' ? 'text-[#ff0055]' : 'text-slate-400'}`} />
                    <span className="text-[7px] font-black uppercase tracking-wider text-white mt-0.5">Pack</span>
                  </button>

                  {/* Miniatura de cada producto */}
                  {selectedCombo.productIds.map((pid, idx) => {
                    const p = products.find(prod => prod.id === pid);
                    if (!p) return null;
                    const pImg = p.imageUrl || getPlaceholderImage(p.name);
                    const isSelected = activeComboImage === pImg;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveComboImage(pImg)}
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
                        const isActive = activeComboImage === pImg;
                        return (
                          <button 
                            key={idx} 
                            type="button"
                            onClick={() => setActiveComboImage(pImg)}
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
                        onClick={decreaseComboQuantity}
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
                        onClick={increaseComboQuantity}
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
                      onClick={() => {
                        addToCart(selectedCombo, comboQuantity);
                        setSelectedCombo(null);
                      }}
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
};

// El componente AdminDashboard se importa desde su propio módulo independiente.

// Componente para proteger la ruta de administrador
const PrivateAdminRoute = ({ children }) => {
  const { currentUser, userProfile, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  const isAdminVal = userProfile?.isAdmin === true || 
                     userProfile?.isAdmin?.toString().toLowerCase() === 'true' || 
                     userProfile?.isAdmin === 1;

  if (!currentUser || !isAdminVal) {
    return <Navigate to="/auth/login" replace />;
  }

  return children;
};

// Componente para proteger la ruta de cliente
const PrivateCustomerRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/auth/login" replace />;
  }

  return children;
};

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/auth/login" element={<Login />} />
      <Route path="/auth/register" element={<Register />} />
      <Route path="/auth/forgot-password" element={<ForgotPassword />} />
      <Route path="/products" element={<Products />} />
      <Route path="/combos" element={<Combos />} />
      <Route path="/cart" element={<Cart />} />
      
      {/* Ruta de Perfil Protegida */}
      <Route 
        path="/profile" 
        element={
          <PrivateCustomerRoute>
            <Profile />
          </PrivateCustomerRoute>
        } 
      />

      {/* Ruta Administrativa Protegida */}
      <Route 
        path="/admin" 
        element={
          <PrivateAdminRoute>
            <AdminDashboard />
          </PrivateAdminRoute>
        } 
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
