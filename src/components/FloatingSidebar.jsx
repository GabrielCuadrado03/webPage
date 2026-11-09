import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  User, 
  ShoppingBag, 
  Droplet, 
  Zap, 
  Sparkles, 
  Flame, 
  Package,
  ShieldAlert
} from 'lucide-react';

// Selector de iconos dinámicos basado en nombres de categorías comunes
const getCategoryIcon = (name) => {
  const n = name.toLowerCase();
  if (n.includes('vape') || n.includes('dispositivo') || n.includes('equipo') || n.includes('kit') || n.includes('linerna')) {
    return <Zap className="h-5 w-5" />;
  }
  if (n.includes('liquid') || n.includes('esencia') || n.includes('sabor') || n.includes('droplet')) {
    return <Droplet className="h-5 w-5" />;
  }
  if (n.includes('combo') || n.includes('pack') || n.includes('promocion') || n.includes('polly')) {
    return <Flame className="h-5 w-5" />;
  }
  if (n.includes('desechable') || n.includes('disposable') || n.includes('pod') || n.includes('bang')) {
    return <Package className="h-5 w-5" />;
  }
  return <Sparkles className="h-5 w-5" />;
};

export default function FloatingSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, userProfile } = useAuth();
  const [categories, setCategories] = useState([]);
  const [selectedCatId, setSelectedCatId] = useState('all');

  // Cargar categorías en tiempo real desde Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'categories'), (snapshot) => {
      const catList = [];
      snapshot.forEach((doc) => {
        catList.push({
          id: doc.id,
          name: doc.data().name || 'Categoría',
          imageUrl: doc.data().imageUrl || ''
        });
      });
      setCategories(catList);
    }, (error) => {
      console.warn("Firestore sidebar load failed: ", error);
    });
    return () => unsub();
  }, []);

  // Sincronizar el botón activo de categoría con la URL actual y estado de navegación
  useEffect(() => {
    if (location.pathname !== '/products') {
      setSelectedCatId(null);
    } else {
      // Si estamos en la página de productos, verificar si hay un estado
      const stateId = location.state?.selectedCategoryId;
      if (stateId) {
        setSelectedCatId(stateId);
      }
    }
  }, [location]);

  // Manejar el click en categorías
  const handleCategoryClick = (catId) => {
    setSelectedCatId(catId);
    navigate('/products', { state: { selectedCategoryId: catId } });
    
    // Si ya estamos en /products, enviamos un evento personalizado para forzar la actualización del filtro de categoría
    const event = new CustomEvent('categoryFilterChanged', { detail: catId });
    window.dispatchEvent(event);
  };

  const isAdmin = userProfile?.isAdmin === true || 
                  userProfile?.isAdmin?.toString().toLowerCase() === 'true' || 
                  userProfile?.isAdmin === 1;

  return (
    <div className="hidden lg:flex fixed right-6 top-1/2 -translate-y-1/2 flex-col items-center bg-[#07090e]/85 border border-slate-800/80 rounded-[32px] p-3.5 space-y-4 backdrop-blur-xl shadow-2xl z-40 w-16">
      
      {/* Botón de Perfil (Glow Cyan) */}
      <button
        onClick={() => navigate(currentUser ? '/profile' : '/auth/login')}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 relative cursor-pointer border group ${
          currentUser 
            ? 'border-[#00d2ff] bg-[#00d2ff]/10 text-[#00d2ff] shadow-[0_0_12px_rgba(0,210,255,0.25)]' 
            : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:text-white hover:border-[#00d2ff] hover:shadow-[0_0_12px_rgba(0,210,255,0.2)]'
        }`}
        title={currentUser ? `Mi Perfil: ${userProfile?.name || currentUser.email}` : "Iniciar Sesión"}
      >
        <User className="h-5 w-5 stroke-[2]" />
        
        {/* Tooltip */}
        <span className="absolute right-14 bg-slate-950/95 border border-slate-800 text-white text-[10px] font-bold uppercase tracking-wider py-1 px-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
          {currentUser ? 'Mi Perfil' : 'Ingresar'}
        </span>
      </button>

      {/* Separador */}
      <div className="w-6 h-[1px] bg-slate-800/50" />

      {/* Botón Todos los Productos */}
      <button
        onClick={() => handleCategoryClick('all')}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 relative cursor-pointer border group ${
          selectedCatId === 'all'
            ? 'border-[#ff0055] bg-[#ff0055]/10 text-[#ff0055] shadow-[0_0_12px_rgba(255,0,85,0.25)]'
            : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:text-white hover:border-[#ff0055] hover:shadow-[0_0_12px_rgba(255,0,85,0.2)]'
        }`}
        title="Todos los Productos"
      >
        <ShoppingBag className="h-4.5 w-4.5 stroke-[2]" />
        
        {/* Tooltip */}
        <span className="absolute right-14 bg-slate-950/95 border border-slate-800 text-white text-[10px] font-bold uppercase tracking-wider py-1 px-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
          Todos los Productos
        </span>
      </button>

      {/* Lista de Categorías Dinámicas */}
      {categories.map((cat) => {
        const isActive = selectedCatId === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => handleCategoryClick(cat.id)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 relative cursor-pointer border group ${
              isActive
                ? 'border-[#ff0055] bg-[#ff0055]/10 text-[#ff0055] shadow-[0_0_12px_rgba(255,0,85,0.25)]'
                : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:text-white hover:border-[#ff0055] hover:shadow-[0_0_12px_rgba(255,0,85,0.2)]'
            }`}
            title={cat.name}
          >
            {cat.imageUrl ? (
              <img 
                src={cat.imageUrl} 
                alt={cat.name} 
                className="w-5.5 h-5.5 object-contain group-hover:scale-110 transition-transform duration-300"
              />
            ) : (
              getCategoryIcon(cat.name)
            )}
            
            {/* Tooltip */}
            <span className="absolute right-14 bg-slate-950/95 border border-slate-800 text-white text-[10px] font-bold uppercase tracking-wider py-1 px-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
              {cat.name}
            </span>
          </button>
        );
      })}

      {/* Panel Admin Rápido (Sólo si es Admin) */}
      {currentUser && isAdmin && (
        <>
          <div className="w-6 h-[1px] bg-slate-800/50" />
          <button
            onClick={() => navigate('/admin')}
            className="w-10 h-10 rounded-full flex items-center justify-center border border-purple-500 bg-purple-500/10 text-purple-400 hover:bg-purple-500 hover:text-white hover:shadow-[0_0_12px_rgba(168,85,247,0.4)] transition-all duration-300 relative cursor-pointer group"
            title="Panel de Administración"
          >
            <ShieldAlert className="h-5 w-5" />
            <span className="absolute right-14 bg-slate-950/95 border border-slate-800 text-white text-[10px] font-bold uppercase tracking-wider py-1 px-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
              Administración
            </span>
          </button>
        </>
      )}

    </div>
  );
}
