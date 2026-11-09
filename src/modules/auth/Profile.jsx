import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import Button from '../../components/Button';
import { getCurrentLocationAddress, searchAddresses } from '../../utils/locationHelper';
import { 
  User, 
  MapPin, 
  ShoppingBag, 
  Plus, 
  Trash2, 
  LogOut,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Heart
} from 'lucide-react';

// No mock products fallback definition

export default function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, userProfile, logout, toggleFavorite, addUserAddress, removeUserAddress } = useAuth();
  const { addToCart } = useCart();

  // Estados
  const [activeTab, setActiveTab] = useState(() => {
    return location.state?.activeTab || 'profile';
  });
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [productsList, setProductsList] = useState([]);

  // Sincronizar pestaña si viene de navegación con estado
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
      // Limpiar el estado de navegación para evitar fijar la pestaña al refrescar
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Estados de formularios locales
  const [addressLabel, setAddressLabel] = useState('');
  const [addressValue, setAddressValue] = useState('');
  const [addressError, setAddressError] = useState(null);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const debounceTimeoutRef = useRef(null);
  const containerRef = useRef(null);

  // Cerrar el dropdown al hacer clic fuera del componente
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleFetchLocation = async () => {
    setFetchingLocation(true);
    setAddressError(null);
    setSuggestions([]);
    setShowDropdown(false);
    try {
      const address = await getCurrentLocationAddress();
      setAddressValue(address);
      if (!addressLabel.trim()) {
        setAddressLabel('Mi Ubicación');
      }
    } catch (err) {
      console.error(err);
      setAddressError(err.message);
    } finally {
      setFetchingLocation(false);
    }
  };

  // Manejar cambios en el input de dirección con debounce de 450ms
  const handleAddressChange = (e) => {
    const val = e.target.value;
    setAddressValue(val);

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (val.trim().length < 4) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    setShowDropdown(true);
    setSearchLoading(true);

    debounceTimeoutRef.current = setTimeout(async () => {
      const results = await searchAddresses(val);
      setSuggestions(results);
      setSearchLoading(false);
    }, 450);
  };

  const handleSelectSuggestion = (suggestion) => {
    setAddressValue(suggestion.displayName);
    if (!addressLabel.trim()) {
      setAddressLabel('Mi Ubicación');
    }
    setSuggestions([]);
    setShowDropdown(false);
  };

  // Escuchar órdenes de este cliente en tiempo real
  useEffect(() => {
    if (!currentUser) return;
    setLoadingOrders(true);

    const q = query(
      collection(db, 'orders'),
      where('customerId', '==', currentUser.uid)
    );

    const unsubOrders = onSnapshot(q, (snapshot) => {
      const orderList = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        orderList.push({
          id: doc.id,
          ...data
        });
      });
      // Ordenar por fecha de creación (de más reciente a más antiguo)
      orderList.sort((a, b) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      });
      
      setOrders(orderList);
      setLoadingOrders(false);
    }, (error) => {
      console.error("Error al escuchar órdenes:", error);
      setLoadingOrders(false);
    });

    return () => unsubOrders();
  }, [currentUser]);

  // Escuchar catálogo de productos en tiempo real para resolver imágenes/precios de favoritos
  useEffect(() => {
    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const prodList = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const discountVal = data.userDiscount !== undefined ? data.userDiscount : (data.discount || 0);
        prodList.push({
          id: doc.id,
          name: data.name,
          price: data.price,
          imageUrl: data.imageUrl,
          userDiscount: discountVal,
          discount: discountVal,
          stock: data.stock || 0
        });
      });

      setProductsList(prodList);
    }, () => {
      setProductsList([]);
    });

    return () => unsubProducts();
  }, []);

  // Agregar Dirección de Envío
  const handleAddAddress = async (e) => {
    e.preventDefault();
    setAddressError(null);

    if (!addressLabel.trim() || !addressValue.trim()) {
      setAddressError('Por favor rellena ambos campos.');
      return;
    }

    try {
      await addUserAddress(addressLabel, addressValue);
      setAddressLabel('');
      setAddressValue('');
    } catch (err) {
      setAddressError('Error al guardar la dirección.');
    }
  };

  // Cierre de Sesión
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth/login');
    } catch (err) {
      console.error(err);
    }
  };

  // Resolver productos marcados como favoritos
  const favoriteProductIds = userProfile?.favoriteProductIds || [];
  const favoriteProducts = productsList.filter((p) => favoriteProductIds.includes(p.id));

  // Resolver Nombre de Item en Carrito
  const formatStatus = (status) => {
    const statuses = {
      pendiente: { label: '🟡 Pendiente', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: null },
      confirmado: { label: '🔵 Confirmado', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: null },
      completado: { label: '🟢 Entregado', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: null },
      entregado: { label: '🟢 Entregado', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: null },
      cancelado: { label: '🔴 Pedido Cancelado', color: 'bg-red-500/10 text-red-400 border-red-500/20', icon: null }
    };
    return statuses[status] || { label: status, color: 'bg-slate-800 text-slate-400', icon: null };
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Reciente';
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn text-left text-slate-100">
      
      {/* ========================================================
          👤 TARJETA DEL PERFIL DE USUARIO (HEADER PREMIUM)
          ======================================================== */}
      <div className="bg-gradient-to-br from-slate-900 via-[#0d1326] to-[#0b0f19] border border-slate-800/60 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-36 h-36 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center space-x-4 sm:space-x-6 text-left">
          <div className="p-5 bg-gradient-to-tr from-purple-500 to-indigo-600 rounded-2xl shadow-xl shadow-purple-500/10">
            <User className="h-8 w-8 text-white" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-extrabold tracking-tight text-white uppercase">{userProfile?.name || 'Usuario Ethereal'}</h2>
            <p className="text-sm text-slate-400 font-normal">{currentUser?.email}</p>
            <p className="text-xs text-slate-500 flex items-center pt-0.5">
              <Calendar className="h-3.5 w-3.5 mr-1" />
              <span>Cliente Oficial Ethereal Vapes</span>
            </p>
          </div>
        </div>

        <Button 
          variant="danger" 
          size="sm"
          onClick={handleLogout}
          className="flex items-center space-x-2 cursor-pointer flex-shrink-0"
        >
          <LogOut className="h-4 w-4" />
          <span>Cerrar Sesión</span>
        </Button>
      </div>

      {/* ========================================================
          📊 TABS DE NAVEGACIÓN RESPONSIVAS
          ======================================================== */}
      <div className="flex border-b border-slate-800/80 gap-6">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-4 text-sm font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer focus:outline-none ${activeTab === 'profile' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-450 hover:text-white'}`}
        >
          Perfil y Direcciones
        </button>

        <button
          onClick={() => setActiveTab('purchases')}
          className={`pb-4 text-sm font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer focus:outline-none ${activeTab === 'purchases' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-450 hover:text-white'}`}
        >
          Mis Compras ({orders.length})
        </button>

        <button
          onClick={() => setActiveTab('favorites')}
          className={`pb-4 text-sm font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer focus:outline-none ${activeTab === 'favorites' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-450 hover:text-white'}`}
        >
          Favoritos ({favoriteProducts.length})
        </button>
      </div>

      {/* ========================================================
          📦 PESTAÑA 1: PERFIL Y DIRECCIONES
          ======================================================== */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start animate-fadeIn">
          
          {/* Tarjeta Datos de contacto */}
          <div className="md:col-span-5 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white uppercase tracking-wider">Contacto</h3>
            <div className="space-y-3 text-xs leading-relaxed">
              <div>
                <span className="block text-slate-500 uppercase tracking-widest font-bold text-[9px] mb-1">Nombre Completo</span>
                <span className="text-slate-200 text-sm font-medium">{userProfile?.name || 'Karen Sanchez'}</span>
              </div>
              <div>
                <span className="block text-slate-500 uppercase tracking-widest font-bold text-[9px] mb-1">Email Registrado</span>
                <span className="text-slate-200 text-sm font-medium">{currentUser?.email}</span>
              </div>
              <div>
                <span className="block text-slate-500 uppercase tracking-widest font-bold text-[9px] mb-1">Celular / WhatsApp</span>
                <span className="text-slate-200 text-sm font-medium">{userProfile?.phoneNumber || 'No especificado'}</span>
              </div>
            </div>
          </div>

          {/* Tarjeta Direcciones de Envío */}
          <div className="md:col-span-7 space-y-6">
            
            {/* Lista de direcciones */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 space-y-4">
              <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-purple-400" />
                <span>Direcciones de Entrega</span>
              </h3>

              {(!userProfile?.addresses || userProfile.addresses.length === 0) ? (
                <p className="text-slate-500 text-xs">Aún no tienes ninguna dirección de entrega guardada.</p>
              ) : (
                <div className="space-y-3 max-h-56 overflow-y-auto">
                  {userProfile.addresses.map((a, idx) => (
                    <div 
                      key={idx}
                      className="bg-slate-950/40 border border-slate-850 p-3.5 rounded-xl flex items-center justify-between gap-4"
                    >
                      <div className="text-left space-y-1 truncate">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded border border-purple-500/20 max-w-fit block">
                          {a.label}
                        </span>
                        <span className="text-slate-300 text-xs font-normal truncate block leading-normal pt-0.5">{a.address}</span>
                      </div>

                      <button
                        onClick={() => removeUserAddress(a.label, a.address)}
                        title="Eliminar dirección"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-950/50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 space-y-4 relative" ref={containerRef}>
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                  <Plus className="h-5 w-5 text-purple-400" />
                  <span>Agregar Nueva Dirección</span>
                </h3>
                <button
                  type="button"
                  onClick={handleFetchLocation}
                  disabled={fetchingLocation}
                  className="text-[10px] font-bold text-purple-400 hover:text-purple-300 disabled:text-slate-650 flex items-center space-x-1 cursor-pointer transition-colors focus:outline-none"
                >
                  {fetchingLocation ? (
                    <>
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-purple-400 border-t-transparent" />
                      <span>Buscando GPS...</span>
                    </>
                  ) : (
                    <>
                      <MapPin className="h-3.5 w-3.5 text-purple-400 animate-pulse" />
                      <span>Usar ubicación GPS</span>
                    </>
                  )}
                </button>
              </div>

              {addressError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-1.5">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{addressError}</span>
                </div>
              )}

              <form onSubmit={handleAddAddress} className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-left">
                <div className="sm:col-span-4">
                  <input
                    type="text"
                    value={addressLabel}
                    onChange={(e) => setAddressLabel(e.target.value)}
                    placeholder="Etiqueta (ej: Casa)"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 text-xs"
                  />
                </div>
                <div className="sm:col-span-6 relative">
                  <input
                    type="text"
                    value={addressValue}
                    onChange={handleAddressChange}
                    onFocus={() => {
                      if (addressValue.trim().length >= 4) {
                        setShowDropdown(true);
                      }
                    }}
                    placeholder="Calle 10 # 5-20, Bogotá"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 text-xs"
                  />

                  {/* Dropdown de Sugerencias Premium */}
                  {showDropdown && (suggestions.length > 0 || searchLoading) && (
                    <div className="absolute left-0 right-0 mt-1.5 bg-slate-950/95 border border-purple-500/30 backdrop-blur-md rounded-xl shadow-2xl z-50 overflow-hidden max-h-52 overflow-y-auto animate-fadeIn">
                      {searchLoading ? (
                        <div className="flex items-center justify-center py-4 space-x-2 text-xs text-slate-400">
                          <div className="animate-spin rounded-full h-4.5 w-4.5 border-2 border-purple-500 border-t-transparent animate-pulse" />
                          <span>Buscando sugerencias...</span>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-900">
                          {suggestions.map((suggestion) => (
                            <button
                              key={suggestion.id}
                              type="button"
                              onClick={() => handleSelectSuggestion(suggestion)}
                              className="w-full px-4 py-3 text-left text-xs text-slate-350 hover:text-white hover:bg-purple-500/10 active:bg-purple-500/20 flex items-start space-x-2 transition-colors cursor-pointer focus:outline-none"
                            >
                              <MapPin className="h-3.5 w-3.5 mt-0.5 text-purple-400 flex-shrink-0" />
                              <div className="space-y-0.5 truncate text-left">
                                <span className="font-bold block text-white truncate">{suggestion.displayName}</span>
                                <span className="text-[10px] text-slate-500 block truncate">{suggestion.fullName}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit" variant="outline" size="sm" className="w-full text-xs py-2 px-1 cursor-pointer">
                    Añadir
                  </Button>
                </div>
              </form>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================
          📦 PESTAÑA 2: HISTORIAL DE COMPRAS (PEDIDOS FIRESTORE)
          ======================================================== */}
      {activeTab === 'purchases' && (
        <div className="space-y-4 animate-fadeIn">
          {loadingOrders ? (
            <div className="flex items-center justify-center py-10 space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-500 border-t-transparent" />
              <p className="text-slate-500 text-xs">Cargando compras...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/20 border border-slate-800/80 rounded-3xl space-y-4 max-w-md mx-auto">
              <ShoppingBag className="h-10 w-10 text-slate-500 mx-auto" />
              <h4 className="text-base font-bold text-slate-200">Aún no tienes compras</h4>
              <p className="text-slate-450 text-xs max-w-xs mx-auto">
                Realiza tus pedidos desde la tienda y consulta aquí su estado de entrega en tiempo real.
              </p>
              <Button variant="primary" size="sm" onClick={() => navigate('/products')} className="cursor-pointer">
                Explorar Productos
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((o) => {
                const statusDetails = formatStatus(o.status);
                const shortId = o.id.substring(0, 6).toUpperCase();

                return (
                  <div 
                    key={o.id}
                    className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-colors flex flex-col md:flex-row gap-5 items-start justify-between text-left"
                  >
                    {/* Información Básica */}
                    <div className="space-y-3 flex-grow max-w-md">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-extrabold uppercase tracking-widest text-slate-300">
                          Pedido #{shortId}
                        </span>
                        
                        <span className="text-[10px] font-bold text-slate-400 font-mono">
                          ({formatDate(o.createdAt)})
                        </span>
                        
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border ${statusDetails.color}`}>
                          {statusDetails.icon}
                          {statusDetails.label}
                        </span>
                      </div>

                      {/* Lista de productos */}
                      <div className="space-y-1.5">
                        {o.items?.map((item, idx) => (
                          <div key={idx} className="flex items-center space-x-2 text-xs text-slate-400">
                            <span className="font-extrabold text-slate-300">{item.quantity}x</span>
                            <span className="truncate max-w-[200px] sm:max-w-xs">{item.name}</span>
                            <span className="text-slate-500 font-mono">(${(item.price * item.quantity).toFixed(2)})</span>
                          </div>
                        ))}
                      </div>

                      {/* Dirección */}
                      <div className="text-[10px] text-slate-500 leading-normal flex items-start pt-1">
                        <MapPin className="h-3.5 w-3.5 mr-1 flex-shrink-0 mt-0.5 text-slate-650" />
                        <span className="truncate max-w-[280px] sm:max-w-sm">Entrega: {o.customerAddress}</span>
                      </div>
                    </div>

                    {/* Totales y Acciones */}
                    <div className="text-right flex flex-col justify-between h-full md:self-stretch gap-4">
                      <div>
                        <span className="text-3xs text-slate-500 block">Total pagado</span>
                        <span className="text-lg font-mono font-extrabold text-white">${o.totalAmount.toFixed(2)}</span>
                      </div>
                      
                      {o.status === 'pendiente' && (
                        <div className="text-[10px] text-orange-400 font-semibold flex items-center bg-orange-500/5 px-2.5 py-1 rounded-lg border border-orange-500/10">
                          <span>Esperando confirmación</span>
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          📦 PESTAÑA 3: MIS FAVORITOS (VISTA GRID)
          ======================================================== */}
      {activeTab === 'favorites' && (
        <div className="animate-fadeIn">
          {favoriteProducts.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/20 border border-slate-800/80 rounded-3xl space-y-4 max-w-md mx-auto">
              <Heart className="h-10 w-10 text-slate-500 mx-auto" />
              <h4 className="text-base font-bold text-slate-200">Sin favoritos guardados</h4>
              <p className="text-slate-450 text-xs max-w-xs mx-auto">
                Marca con una estrella tus vaporizadores y sabores preferidos para agruparlos en esta sección.
              </p>
              <Button variant="primary" size="sm" onClick={() => navigate('/products')} className="cursor-pointer">
                Explorar Catálogo
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {favoriteProducts.map((p) => {
                const hasDiscount = p.userDiscount > 0;
                const finalPrice = hasDiscount ? p.price * (1 - p.userDiscount / 100) : p.price;
                const isOutOfStock = p.stock === 0;

                return (
                  <div 
                    key={p.id}
                    className="group bg-slate-900/40 border border-slate-800/85 hover:border-purple-500/30 rounded-2xl overflow-hidden hover:-translate-y-1 transition-all duration-300 flex flex-col relative"
                  >
                    {/* Botón rápido para eliminar de favoritos */}
                    <button
                      onClick={() => toggleFavorite(p.id)}
                      title="Eliminar de favoritos"
                      className="absolute top-3 right-3 z-20 p-2 rounded-lg bg-slate-950/60 text-pink-500 border border-slate-800 hover:text-slate-400 hover:bg-slate-950 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    {/* Contenedor Imagen */}
                    <div className="h-36 overflow-hidden bg-slate-950 relative flex items-center justify-center">
                      <img 
                        src={p.imageUrl} 
                        alt={p.name}
                        className="w-full h-full object-cover opacity-75 group-hover:opacity-90"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 to-transparent" />
                    </div>

                    {/* Cuerpo de la tarjeta */}
                    <div className="p-4 flex flex-col justify-between flex-grow space-y-3">
                      <div className="text-left space-y-0.5">
                        <h4 className="text-sm font-bold text-white truncate group-hover:text-purple-400 transition-colors leading-tight">
                          {p.name}
                        </h4>
                        
                        <div>
                          {hasDiscount ? (
                            <div className="flex items-baseline space-x-1.5">
                              <span className="text-xs text-slate-500 line-through font-medium">${p.price.toFixed(2)}</span>
                              <span className="text-sm font-extrabold text-white">${finalPrice.toFixed(2)}</span>
                            </div>
                          ) : (
                            <span className="text-sm font-extrabold text-white">${p.price.toFixed(2)}</span>
                          )}
                        </div>
                      </div>

                      {/* Botón Añadir Rápido */}
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={isOutOfStock}
                        onClick={() => addToCart(p, 1)}
                        className="w-full font-bold text-xs py-2 flex items-center justify-center space-x-1 cursor-pointer"
                      >
                        <ShoppingBag className="h-3.5 w-3.5" />
                        <span>{isOutOfStock ? 'Agotado' : 'Añadir Cesta'}</span>
                      </Button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
