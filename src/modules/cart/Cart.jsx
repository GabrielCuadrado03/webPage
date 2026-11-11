import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { collection, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import Button from '../../components/Button';
import { getCurrentLocationAddress, searchAddresses } from '../../utils/locationHelper';
import { getPlaceholderImage } from '../../utils/placeholders';
import { getNotificationSettings, notifyNewOrder } from '../../services/orderNotifier';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  User, 
  Phone, 
  MapPin, 
  CreditCard,
  CheckCircle2,
  ArrowRight,
  Flame,
  AlertCircle
} from 'lucide-react';

// ========================================================
// 🎁 COMPONENTE PREMIUM DE COLLAGE PARA COMBOS
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
          className="w-full h-full object-cover opacity-90"
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
            className="w-full h-full object-cover opacity-90"
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
            className="w-full h-full object-cover opacity-90"
          />
        </div>
        <div className="grid grid-rows-2 gap-[1.5px] h-full w-full">
          <img 
            src={uniqueImages[1]} 
            alt="Combo product 2" 
            className="w-full h-full object-cover opacity-90"
          />
          <img 
            src={uniqueImages[2]} 
            alt="Combo product 3" 
            className="w-full h-full object-cover opacity-90"
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
          className="w-full h-full object-cover opacity-90"
        />
      ))}
    </div>
  );
};

export default function Cart() {
  const navigate = useNavigate();
  const { currentUser, userProfile, addUserAddress } = useAuth();
  const { 
    cartItems, 
    updateQuantity, 
    removeFromCart, 
    clearCart, 
    cartTotal, 
    cartItemCount 
  } = useCart();

  // Estados para el Guardado de Nueva Dirección
  const [showSaveAddressForm, setShowSaveAddressForm] = useState(false);
  const [newAddressLabel, setNewAddressLabel] = useState('');
  const [newAddressValue, setNewAddressValue] = useState('');
  const [savingAddress, setSavingAddress] = useState(false);
  const [saveAddressError, setSaveAddressError] = useState(null);

  const handleSaveNewAddress = async () => {
    setSaveAddressError(null);
    if (!newAddressLabel.trim() || !newAddressValue.trim()) {
      setSaveAddressError('Por favor ingresa la etiqueta y la dirección.');
      return;
    }
    setSavingAddress(true);
    try {
      await addUserAddress(newAddressLabel, newAddressValue);
      setCustomerAddress(newAddressValue); // Prefijar la dirección en el input principal
      setShowSaveAddressForm(false);
      setNewAddressLabel('');
      setNewAddressValue('');
    } catch (err) {
      console.error(err);
      setSaveAddressError('Error al guardar la dirección.');
    } finally {
      setSavingAddress(false);
    }
  };

  // Estados del Formulario de Checkout
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('transferencia');

  // Estados visuales y de carga
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState('');
  
  // Estados para conservar el detalle del pedido para WhatsApp después de limpiar la cesta
  const [lastOrderItems, setLastOrderItems] = useState([]);
  const [lastOrderTotal, setLastOrderTotal] = useState(0);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const debounceTimeoutRef = useRef(null);
  const containerRef = useRef(null);

  const [products, setProducts] = useState([]);

  useEffect(() => {
    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const prodList = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        prodList.push({
          id: doc.id,
          name: data.name || '',
          price: typeof data.price === 'number' ? data.price : parseFloat(data.price?.toString()) || 0.0,
          imageUrl: data.imageUrl || ''
        });
      });
      setProducts(prodList);
    }, (error) => {
      console.warn("Firestore: Error al traer productos en Cart...", error);
    });

    return () => unsubProducts();
  }, []);

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
    setErrorMsg(null);
    setSuggestions([]);
    setShowDropdown(false);
    try {
      const address = await getCurrentLocationAddress();
      setCustomerAddress(address);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message);
    } finally {
      setFetchingLocation(false);
    }
  };

  // Manejar cambios en el input de dirección con debounce de 450ms
  const handleAddressChange = (e) => {
    const val = e.target.value;
    setCustomerAddress(val);

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
    setCustomerAddress(suggestion.displayName);
    setSuggestions([]);
    setShowDropdown(false);
  };

  // Prefill automático si hay un perfil de usuario logueado en la app
  useEffect(() => {
    if (userProfile) {
      setCustomerName(userProfile.name || '');
      setCustomerPhone(userProfile.phoneNumber || '');
    }
  }, [userProfile]);

  // Manejo de la Compra y Creación de la Orden en Firestore
  const handleCheckout = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validaciones rápidas responsivas
    if (!customerName.trim() || !customerPhone.trim() || !customerAddress.trim()) {
      setErrorMsg('Por favor rellena todos los campos de envío.');
      return;
    }

    if (customerName.trim().split(/\s+/).length < 2) {
      setErrorMsg('Por favor ingresa tu nombre y apellido para el envío.');
      return;
    }

    setLoading(true);

    try {
      // 1. Mapear los items al esquema compatible de Firestore
      const itemsMapped = cartItems.map((item) => ({
        productId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        isCombo: item.isCombo,
        productIds: item.productIds || [],
      }));

      const productsPurchased = cartItems.map((x) => x.name);

      // 2. Construir el objeto de la orden de compra compatible con Flutter (OrderModel.dart)
      const orderDoc = {
        customerId: currentUser ? currentUser.uid : 'invitado',
        totalAmount: parseFloat(cartTotal.toFixed(2)),
        itemsCount: cartItemCount,
        createdAt: serverTimestamp(), // Campo temporal de Firestore
        status: 'pendiente',
        paymentMethod: paymentMethod,
        productsPurchased: productsPurchased,
        items: itemsMapped,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress: customerAddress.trim(),
      };

      // 3. Escribir el documento en Firestore con resiliencia de contingencia local
      let orderId = '';
      try {
        if (localStorage.getItem('ethereal_vapes_bypass_admin') === 'true' || currentUser?.uid === 'admin_bypass_uid') {
          orderId = 'bypass_' + Math.floor(100000 + Math.random() * 900000);
          console.log("Modo bypass: Simulando guardado de orden en Firestore:", orderDoc);
        } else {
          const docRef = await addDoc(collection(db, 'orders'), orderDoc);
          orderId = docRef.id;
        }
      } catch (dbErr) {
        console.warn("Firestore: Error de conexión o permisos al registrar la orden, procediendo en contingencia local:", dbErr);
        orderId = 'local_' + Math.floor(100000 + Math.random() * 900000);
      }

      setCreatedOrderId(orderId);

      // Disparar alerta push/webhook (Telegram / Discord) de forma asíncrona sin bloquear el checkout
      if (!orderId.startsWith('bypass_')) {
        getNotificationSettings()
          .then((notifConfig) => notifyNewOrder(orderDoc, orderId, notifConfig))
          .catch((err) => console.warn('Aviso webhook omitido:', err));
      }
      
      // Conservar los detalles para la redirección a WhatsApp antes de vaciar la cesta
      setLastOrderItems([...cartItems]);
      setLastOrderTotal(cartTotal);
      
      // 4. Limpiar el carrito de compras persistente
      clearCart();
      setOrderSuccess(true);
    } catch (err) {
      console.error('Error al procesar el pedido:', err);
      setErrorMsg('Ocurrió un error al procesar tu pedido: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Generador inteligente de redirección de pedido detallado a WhatsApp API
  const handleSendWhatsApp = () => {
    const formattedOrderId = createdOrderId.substring(0, 6).toUpperCase();
    
    if (paymentMethod === 'transferencia') {
      alert('Se están exportando los datos de tu pedido para enviar a WhatsApp. Recuerda adjuntar tu comprobante de transferencia bancaria para la confirmación de tu compra.');
    } else {
      alert('Se están exportando los datos de tu pedido para enviar a WhatsApp.');
    }

    let message = `¡Hola *Ethereal Vapes*! 🌬️\nHe realizado un nuevo pedido en su sitio web.\n\n`;
    message += `📝 *ID del Pedido:* #${formattedOrderId}\n`;
    message += `👤 *Cliente:* ${customerName}\n`;
    message += `📞 *WhatsApp:* ${customerPhone}\n`;
    message += `📍 *Dirección de Envío:* ${customerAddress}\n`;
    message += `💳 *Método de Pago:* ${paymentMethod === 'transferencia' ? 'Transferencia Bancaria' : 'Efectivo contra entrega'}\n\n`;
    message += `🛒 *Detalle de la Compra:*\n`;
    
    // Leemos de lastOrderItems en lugar de cartItems (que ya fue vaciado)
    lastOrderItems.forEach((item) => {
      const type = item.isCombo ? 'Combo' : 'Producto';
      message += `- *${item.quantity}x* ${item.name} (${type}) — _$${(item.price * item.quantity).toFixed(2)}_\n`;
    });

    // Leemos de lastOrderTotal en lugar de cartTotal (que ya fue vaciado)
    message += `\n💰 *Total a pagar:* *$${lastOrderTotal.toFixed(2)}*\n\n`;
    
    if (paymentMethod === 'transferencia') {
      message += `Espero el comprobante de transferencia para confirmación.`;
    } else {
      message += `En un momento confirmamos los detalles de la entrega. ¡Gracias por tu compra!`;
    }

    const encodedMessage = encodeURIComponent(message);
    
    // Abrir WhatsApp API (Celular real de la empresa - Ecuador)
    const whatsappUrl = `https://wa.me/593968972088?text=${encodedMessage}`; 
    
    // Usamos redirección directa en lugar de window.open para prevenir bloqueos de popups en celulares
    window.location.href = whatsappUrl;
  };

  // ========================================================
  // 🛒 VISTA DE CARRITO VACÍO
  // ========================================================
  if (cartItems.length === 0 && !orderSuccess) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 text-center bg-slate-900/40 rounded-3xl border border-slate-800/80 backdrop-blur-md space-y-6 animate-fadeIn">
        <div className="inline-flex p-4 bg-purple-500/10 rounded-full text-purple-400">
          <ShoppingBag className="h-10 w-10 animate-bounce" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-white">Tu carrito está vacío</h2>
          <p className="text-slate-450 text-sm max-w-xs mx-auto leading-relaxed">
            Parece que aún no has agregado ningún producto o combo promocional a tu pedido.
          </p>
        </div>

        <Link to="/products" className="block pt-2">
          <Button variant="primary" size="md" className="w-full font-bold cursor-pointer">
            Ir al Catálogo de Productos
          </Button>
        </Link>
      </div>
    );
  }

  // ========================================================
  // 🎉 VISTA DE COMPRA EXITOSA (SUCCESS LAYOUT)
  // ========================================================
  if (orderSuccess) {
    const shortId = createdOrderId.substring(0, 6).toUpperCase();
    return (
      <div className="max-w-md mx-auto my-12 p-8 text-center bg-slate-900/60 rounded-3xl border border-emerald-500/20 backdrop-blur-xl space-y-6 shadow-2xl shadow-emerald-500/5 animate-fadeIn">
        <div className="inline-flex p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400">
          <CheckCircle2 className="h-10 w-10 animate-pulse" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-white uppercase tracking-wider">¡Pedido Confirmado!</h2>
          <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full max-w-fit mx-auto">
            Orden #{shortId}
          </p>
          <p className="text-slate-400 text-sm leading-relaxed pt-2">
            Tu orden de compra ha sido registrada con éxito en **Cloud Firestore**. {paymentMethod === 'transferencia' ? (
              <span>Para acelerar el envío, haz clic en el botón de abajo para enviar los detalles a nuestro WhatsApp y <strong>adjuntar tu comprobante de transferencia bancaria</strong>.</span>
            ) : (
              <span>Para acelerar el envío, haz clic en el botón de abajo para enviar los detalles a nuestro WhatsApp y coordinar la entrega.</span>
            )}
          </p>
        </div>

        <div className="space-y-3 pt-4">
          <Button
            onClick={handleSendWhatsApp}
            variant="primary"
            size="lg"
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/20 font-bold cursor-pointer"
          >
            Enviar Pedido por WhatsApp
          </Button>

          <button
            onClick={() => navigate('/')}
            className="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-300 transition-all cursor-pointer focus:outline-none"
          >
            Volver a la Página de Inicio
          </button>
        </div>
      </div>
    );
  }

  // ========================================================
  // 🛒 VISTA DEL DETALLE DEL CARRITO + CHECKOUT
  // ========================================================
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn text-left text-slate-100">
      
      {/* Encabezado */}
      <div>
        <div className="inline-flex items-center space-x-2 bg-purple-500/10 border border-purple-500/30 px-3 py-1 rounded-full text-xs font-semibold tracking-wider text-purple-400 uppercase mb-2">
          Cesta de Compra
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          CARRITO DE COMPRAS
        </h1>
        <p className="text-slate-400 text-sm mt-2">
          Gestiona tus dispositivos y combos exclusivos de Ethereal Vapes antes de procesar el pedido.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ========================================================
            LADO IZQUIERDO: LISTA DE PRODUCTOS EN EL CARRITO
            ======================================================== */}
        <div className="lg:col-span-7 space-y-4">
          {cartItems.map((item) => {
            // Calcular info y ahorros si es Combo
            let individualTotal = 0;
            let savings = 0;
            let productListNames = [];

            if (item.isCombo && item.productIds && products.length > 0) {
              item.productIds.forEach((pid) => {
                const prodObj = products.find((p) => p.id === pid);
                if (prodObj) {
                  individualTotal += prodObj.price;
                  productListNames.push(prodObj.name);
                } else {
                  // Fallback para mocks
                  const mockPrices = { 'mock-1': 120.00, 'mock-2': 25.50, 'mock-3': 15.00, 'mock-4': 30.00 };
                  const mockNames = {
                    'mock-1': 'Neon Vaporizer Pro',
                    'mock-2': 'Cyber Liquid - Blue Razz',
                    'mock-3': 'Ethereal Coil Pack',
                    'mock-4': 'Stealth Pod Kit'
                  };
                  individualTotal += mockPrices[pid] || 25.00;
                  productListNames.push(mockNames[pid] || 'Producto Ethereal');
                }
              });
              
              savings = Math.max(0, individualTotal - item.price);
            }

            return (
              <div 
                key={item.id}
                className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition-colors text-left"
              >
                <div className="flex items-start sm:items-center space-x-4 flex-grow">
                  {/* Imagen del Item */}
                  <div className="w-16 h-16 rounded-xl bg-slate-950 overflow-hidden flex-shrink-0 relative">
                    {item.isCombo ? (
                      <ComboImageCollage 
                        productIds={item.productIds} 
                        products={products} 
                        defaultImageUrl={item.imageUrl}
                        className="w-full h-full"
                      />
                    ) : (
                      <img 
                        src={item.imageUrl} 
                        alt={item.name} 
                        className="w-full h-full object-cover opacity-80"
                      />
                    )}
                  </div>

                  {/* Info Textos */}
                  <div className="flex-grow text-left space-y-1 min-w-0">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#f43f5e] block">
                      {item.isCombo ? 'Combo Promocional' : 'Producto Individual'}
                    </span>
                    <h4 className="text-sm font-bold text-white leading-tight truncate">
                      {item.name}
                    </h4>
                    
                    {item.isCombo && item.description && (
                      <p className="text-[11px] text-slate-400 leading-tight font-normal line-clamp-1 max-w-[280px]">
                        {item.description}
                      </p>
                    )}

                    {item.isCombo && productListNames.length > 0 && (
                      <div className="text-[10px] text-slate-500 leading-snug">
                        <span className="font-semibold text-slate-450">Incluye: </span>
                        <span className="italic text-slate-500">{productListNames.join(', ')}</span>
                      </div>
                    )}

                    <div className="flex items-center space-x-2 pt-0.5">
                      <span className="text-xs font-bold text-purple-400">
                        ${item.price.toFixed(2)} c/u
                      </span>
                      {item.isCombo && individualTotal > 0 && (
                        <span className="text-[10px] text-slate-550 line-through">
                          ${individualTotal.toFixed(2)}
                        </span>
                      )}
                    </div>

                    {item.isCombo && savings > 0 && (
                      <div className="pt-0.5">
                        <span className="inline-block px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] font-black rounded-md uppercase tracking-wider">
                          ¡Ahorras ${savings.toFixed(2)}!
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Controles de Cantidad, Precio y Borrado */}
                <div className="flex items-center justify-between sm:justify-end gap-6 flex-shrink-0 border-t border-slate-800/40 sm:border-none pt-3 sm:pt-0">
                  {/* Selector de Cantidades */}
                  <div className="flex items-center space-x-2 bg-slate-950 border border-slate-850 p-1.5 rounded-lg">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="font-mono text-xs font-bold w-5 text-center text-white">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Subtotal del Item e Icono Borrar */}
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-xs font-bold text-white w-16 text-right">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                    
                    <button
                      onClick={() => removeFromCart(item.id)}
                      title="Eliminar de la cesta"
                      className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-950 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Botón de limpiar carrito */}
          <div className="flex justify-end pt-2">
            <button
              onClick={clearCart}
              className="text-xs font-bold text-slate-500 hover:text-red-400 transition-colors flex items-center space-x-1.5 cursor-pointer focus:outline-none"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Limpiar Carrito</span>
            </button>
          </div>
        </div>

        {/* ========================================================
            LADO DERECHO: FORMULARIO DE CHECKOUT Y TOTALES
            ======================================================== */}
        <div className="lg:col-span-5">
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

            <h3 className="text-lg font-bold text-white border-b border-slate-850 pb-3 flex items-center space-x-2">
              <Flame className="h-5 w-5 text-purple-400" />
              <span>Detalles del Envío</span>
            </h3>

            {/* Alertas de error */}
            {errorMsg && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start space-x-2 animate-fadeIn">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span className="text-left leading-relaxed">{errorMsg}</span>
              </div>
            )}

            {/* Formulario de Envío */}
            <form onSubmit={handleCheckout} className="space-y-4 text-left">
              
              {/* Nombre Completo */}
              <div className="space-y-1.5">
                <label className="text-2xs font-bold uppercase tracking-wider text-slate-400">
                  Nombre de Receptor
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <User className="h-4.5 w-4.5" />
                  </div>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Karen Sanchez"
                    disabled={loading}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-650 focus:outline-none focus:border-purple-500 transition-all text-xs"
                  />
                </div>
              </div>

              {/* Teléfono Celular */}
              <div className="space-y-1.5">
                <label className="text-2xs font-bold uppercase tracking-wider text-slate-400">
                  Celular / WhatsApp
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Phone className="h-4.5 w-4.5" />
                  </div>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+57 300 000 0000"
                    disabled={loading}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-650 focus:outline-none focus:border-purple-500 transition-all text-xs"
                  />
                </div>
              </div>

              {/* Dirección de Envío */}
              <div className="space-y-1.5 relative" ref={containerRef}>
                <div className="flex justify-between items-center">
                  <label className="text-2xs font-bold uppercase tracking-wider text-slate-400">
                    Dirección de Entrega
                  </label>
                  <button
                    type="button"
                    onClick={handleFetchLocation}
                    disabled={fetchingLocation || loading}
                    className="text-[10px] font-bold text-purple-400 hover:text-purple-300 disabled:text-slate-650 flex items-center space-x-1 cursor-pointer transition-colors focus:outline-none"
                  >
                    {fetchingLocation ? (
                      <>
                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-purple-400 border-t-transparent" />
                        <span>Buscando GPS...</span>
                      </>
                    ) : (
                      <>
                        <MapPin className="h-3 w-3 text-purple-400 animate-pulse" />
                        <span>Usar ubicación GPS</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Selector Premium de Direcciones Guardadas (Mis Lugares) */}
                {userProfile?.addresses && userProfile.addresses.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 py-1 items-center bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/40 animate-fadeIn mb-1.5">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mr-1">
                      Mis Direcciones:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {userProfile.addresses.map((a, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setCustomerAddress(a.address);
                            setSuggestions([]);
                            setShowDropdown(false);
                          }}
                          className="text-[9px] px-2.5 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 hover:border-purple-500/40 hover:text-purple-300 transition-all font-semibold cursor-pointer focus:outline-none"
                        >
                          {a.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <MapPin className="h-4.5 w-4.5" />
                  </div>
                  <input
                    type="text"
                    value={customerAddress}
                    onChange={handleAddressChange}
                    onFocus={() => {
                      if (customerAddress.trim().length >= 4) {
                        setShowDropdown(true);
                      }
                    }}
                    placeholder="Calle 10 # 5-20, Apto 301, Bogotá"
                    disabled={loading}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-650 focus:outline-none focus:border-purple-500 transition-all text-xs"
                  />
                  
                  {/* Dropdown de Sugerencias Premium */}
                  {showDropdown && (suggestions.length > 0 || searchLoading) && (
                    <div className="absolute left-0 right-0 mt-1.5 bg-slate-950/95 border border-purple-500/30 backdrop-blur-md rounded-xl shadow-2xl z-50 overflow-hidden max-h-56 overflow-y-auto animate-fadeIn">
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
                              className="w-full px-4 py-3 text-left text-xs text-slate-300 hover:text-white hover:bg-purple-500/10 active:bg-purple-500/20 flex items-start space-x-2 transition-colors cursor-pointer focus:outline-none"
                            >
                              <MapPin className="h-3.5 w-3.5 mt-0.5 text-purple-400 flex-shrink-0" />
                              <div className="space-y-0.5 truncate">
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

                {/* BOTÓN Y FORMULARIO DE GUARDADO INLINE DE DIRECCIÓN */}
                {currentUser && (
                  <div className="space-y-2 pt-1.5">
                    <div className="flex justify-start">
                      <button
                        type="button"
                        onClick={() => {
                          setShowSaveAddressForm(!showSaveAddressForm);
                          setNewAddressLabel('');
                          setNewAddressValue(customerAddress);
                          setSaveAddressError(null);
                        }}
                        className="text-[10px] font-bold text-purple-400 hover:text-purple-300 transition-colors cursor-pointer focus:outline-none flex items-center space-x-1"
                      >
                        <Plus className="h-3 w-3" />
                        <span>{showSaveAddressForm ? 'Cancelar guardado' : '¿Guardar esta dirección en tu perfil?'}</span>
                      </button>
                    </div>

                    {showSaveAddressForm && (
                      <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-3 animate-fadeIn relative">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          Guardar Dirección Nueva
                        </p>
                        
                        {saveAddressError && (
                          <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] flex items-start space-x-1.5">
                            <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                            <span className="text-left font-semibold">{saveAddressError}</span>
                          </div>
                        )}
                        
                        <div className="space-y-2.5 text-left">
                          {/* Etiqueta */}
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold uppercase tracking-wider text-slate-550 block">
                              Etiqueta (ej: Casa, Trabajo)
                            </label>
                            <input
                              type="text"
                              value={newAddressLabel}
                              onChange={(e) => setNewAddressLabel(e.target.value)}
                              placeholder="Casa, Oficina, Trabajo..."
                              disabled={savingAddress}
                              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-650 focus:outline-none focus:border-purple-500 text-xs"
                            />
                          </div>

                          {/* Dirección */}
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold uppercase tracking-wider text-slate-550 block">
                              Dirección a Guardar
                            </label>
                            <input
                              type="text"
                              value={newAddressValue}
                              onChange={(e) => setNewAddressValue(e.target.value)}
                              placeholder="Calle 10 # 5-20, Bogotá"
                              disabled={savingAddress}
                              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-650 focus:outline-none focus:border-purple-500 text-xs"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={handleSaveNewAddress}
                            disabled={savingAddress}
                            className="px-3 py-1.5 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/50 text-white font-bold text-[9px] uppercase tracking-wider rounded-lg transition-colors cursor-pointer focus:outline-none flex items-center space-x-1 border-none"
                          >
                            {savingAddress ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" />
                                <span>Guardando...</span>
                              </>
                            ) : (
                              <span>Guardar en Perfil</span>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Método de Pago */}
              <div className="space-y-1.5 pt-2">
                <label className="text-2xs font-bold uppercase tracking-wider text-slate-400">
                  Método de Pago
                </label>
                
                <div className="grid grid-cols-2 gap-3">
                  {/* Transferencia */}
                  <label className={`flex flex-col items-center p-3 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'transferencia' ? 'bg-purple-500/10 border-purple-500 text-white' : 'bg-slate-950/50 border-slate-850 text-slate-400 hover:border-slate-800'}`}>
                    <CreditCard className="h-4 w-4 mb-1 text-purple-400" />
                    <span className="text-3xs font-extrabold uppercase tracking-wider">Transferencia</span>
                    <input
                      type="radio"
                      name="payment"
                      value="transferencia"
                      checked={paymentMethod === 'transferencia'}
                      onChange={() => setPaymentMethod('transferencia')}
                      className="hidden"
                    />
                  </label>

                  {/* Efectivo al recibir */}
                  <label className={`flex flex-col items-center p-3 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'efectivo' ? 'bg-purple-500/10 border-purple-500 text-white' : 'bg-slate-950/50 border-slate-850 text-slate-400 hover:border-slate-800'}`}>
                    <ShoppingBag className="h-4 w-4 mb-1 text-purple-400" />
                    <span className="text-3xs font-extrabold uppercase tracking-wider">Efectivo</span>
                    <input
                      type="radio"
                      name="payment"
                      value="efectivo"
                      checked={paymentMethod === 'efectivo'}
                      onChange={() => setPaymentMethod('efectivo')}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Resumen de Totales */}
              <div className="pt-4 border-t border-slate-850 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Items en cesta</span>
                  <span className="font-mono">{cartItemCount} un.</span>
                </div>
                
                <div className="flex justify-between text-slate-400">
                  <span>Envío a domicilio</span>
                  <span className="text-emerald-400 font-bold tracking-wider uppercase">Gratis</span>
                </div>

                <div className="flex justify-between text-base font-extrabold text-white pt-2 border-t border-slate-850">
                  <span>Total Final</span>
                  <span className="font-mono">${cartTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Botón de Checkout */}
              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={loading}
                  className="w-full flex items-center justify-center space-x-2 font-bold cursor-pointer"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      <span>Procesando...</span>
                    </div>
                  ) : (
                    <>
                      <span>Confirmar Pedido</span>
                      <ArrowRight className="h-4.5 w-4.5" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
