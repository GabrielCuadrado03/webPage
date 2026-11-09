import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { X, ShoppingCart, Flame } from 'lucide-react';

function ToastItem({ notification, onDismiss }) {
  const { id, title, message, type, data } = notification;
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Iniciar animación de salida 350ms antes del unmount automático (Total 5s de vida)
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, 4650);

    // Unmount real tras la animación
    const removeTimer = setTimeout(() => {
      onDismiss(id);
    }, 5000);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [id, onDismiss]);

  const handleManualDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(id);
    }, 350);
  };

  const isCart = type === 'cart';
  
  // Clases y colores adaptados a la paleta premium de Ethereal Vapes (index.css)
  // Cart usa tonos azul/celeste neón (purple en index.css)
  // Purchase usa tonos rojo cereza neón (emerald/teal en index.css)
  const borderClass = isCart 
    ? 'border-purple-500/20 shadow-[0_0_15px_rgba(14,165,233,0.12)]' 
    : 'border-emerald-500/20 shadow-[0_0_15px_rgba(244,63,94,0.12)]';
    
  const iconColorClass = isCart ? 'text-purple-400' : 'text-emerald-400';

  return (
    <div
      className={`pointer-events-auto flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-950/90 border backdrop-blur-md text-slate-100 ${
        isExiting ? 'animate-toast-out' : 'animate-toast-in'
      } transition-all duration-300 w-full`}
      style={{ contentVisibility: 'auto' }}
    >
      {/* Miniatura del producto o Icono */}
      <div className="shrink-0">
        {data?.imageUrl ? (
          <div className="w-11 h-11 rounded-xl bg-slate-900 border border-slate-800/80 overflow-hidden flex items-center justify-center">
            <img 
              src={data.imageUrl} 
              alt={title} 
              className="w-full h-full object-cover opacity-90"
            />
          </div>
        ) : (
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-center">
            {isCart ? (
              <ShoppingCart className={`h-5 w-5 ${iconColorClass}`} />
            ) : (
              <Flame className={`h-5 w-5 ${iconColorClass} animate-pulse`} />
            )}
          </div>
        )}
      </div>

      {/* Detalles del Mensaje */}
      <div className="flex-grow text-left space-y-0.5 min-w-0 pr-1">
        <h4 className="text-xs font-black uppercase tracking-wider text-white truncate">
          {title}
        </h4>
        <p className="text-[11px] text-slate-455 font-normal leading-snug line-clamp-2">
          {message}
        </p>
      </div>

      {/* Botón Cerrar */}
      <button
        onClick={handleManualDismiss}
        className="shrink-0 p-1 rounded-lg text-slate-500 hover:text-white hover:bg-slate-900/60 transition-colors cursor-pointer focus:outline-none"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function NotificationToast() {
  const { notifications, removeNotification } = useCart();

  if (!notifications || notifications.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none max-w-sm w-full px-4 sm:px-0">
      {notifications.map((n) => (
        <ToastItem key={n.id} notification={n} onDismiss={removeNotification} />
      ))}
    </div>
  );
}
