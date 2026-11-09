import React, { useState } from 'react';
import { BrowserRouter as Router, Link, NavLink, useNavigate } from 'react-router-dom';
import { ConfigProvider, useConfig } from './context/ConfigContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import AppRoutes from './routes/AppRoutes';
import AnnouncementBar from './components/AnnouncementBar';
import NotificationToast from './components/NotificationToast';
import FloatingSidebar from './components/FloatingSidebar';
import GlowingBackground from './components/GlowingBackground';
import Button from './components/Button';
import { 
  Menu, 
  X, 
  ShoppingBag, 
  User, 
  Flame, 
  LogOut,
  ShieldCheck,
  Heart
} from 'lucide-react';

function NavigationBar() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { currentUser, userProfile, logout } = useAuth();
  const { cartItemCount } = useCart();
  const { config } = useConfig();

  const handleLogout = async () => {
    try {
      await logout();
      setIsMobileMenuOpen(false);
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    }
  };

  const isAdmin = userProfile?.isAdmin === true || 
                  userProfile?.isAdmin?.toString().toLowerCase() === 'true' || 
                  userProfile?.isAdmin === 1;

    const favoriteCount = userProfile?.favoriteProductIds?.length || 0;

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-[#0b0f19]/75 border-b border-slate-800/80 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <Link to="/" className="flex-shrink-0 flex items-center space-x-3 group">
            <div className="relative w-9 h-9 rounded-full overflow-hidden border border-[#00d2ff]/40 shadow-[0_0_12px_rgba(0,210,255,0.3)] bg-slate-950 flex items-center justify-center p-0.5 group-hover:scale-105 transition-transform duration-300">
              <img src={config?.branding?.logoUrl || "/images/logo.png"} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-lg font-black tracking-widest bg-gradient-to-r from-white via-slate-100 to-slate-350 bg-clip-text text-transparent uppercase font-sans">
              {config?.branding?.siteName || "ETHEREAL VAPES"}
            </span>
          </Link>

          {/* Enlaces de Navegación de Escritorio */}
          <div className="hidden md:flex items-center space-x-8">
            <NavLink 
              to="/" 
              className={({ isActive }) => 
                `text-sm font-medium transition-colors ${isActive ? 'text-purple-400 font-semibold' : 'text-slate-300 hover:text-purple-400'}`
              }
            >
              Inicio
            </NavLink>
            <NavLink 
              to="/products" 
              className={({ isActive }) => 
                `text-sm font-medium transition-colors ${isActive ? 'text-purple-400 font-semibold' : 'text-slate-300 hover:text-purple-400'}`
              }
            >
              Productos
            </NavLink>
            <NavLink 
              to="/combos" 
              className={({ isActive }) => 
                `text-sm font-medium transition-colors ${isActive ? 'text-purple-400 font-semibold' : 'text-slate-300 hover:text-purple-400'}`
              }
            >
              Combos
            </NavLink>
            {currentUser && isAdmin && (
              <NavLink 
                to="/admin" 
                className={({ isActive }) => 
                  `text-sm font-medium transition-colors flex items-center space-x-1 ${isActive ? 'text-purple-400 font-semibold' : 'text-slate-300 hover:text-purple-400'}`
                }
              >
                <ShieldCheck className="h-4 w-4 text-purple-400" />
                <span>Panel Admin</span>
              </NavLink>
            )}
          </div>

          {/* Acciones de Navegación de Escritorio */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Favoritos */}
            <Link 
              to={currentUser ? "/profile" : "/auth/login"}
              state={currentUser ? { activeTab: 'favorites' } : null}
              onClick={(e) => {
                if (!currentUser) {
                  e.preventDefault();
                  if (window.confirm('Debes iniciar sesión para acceder a tus favoritos. ¿Deseas iniciar sesión ahora?')) {
                    navigate('/auth/login');
                  }
                }
              }}
              className="p-2 text-slate-400 hover:text-[#f43f5e] transition-colors relative cursor-pointer"
              title="Mis Favoritos"
            >
              <Heart className="h-5 w-5" />
              {favoriteCount > 0 && (
                <span className="absolute -top-1 -right-1 block min-w-[18px] h-[18px] text-[10px] font-extrabold text-white bg-[#f43f5e] border border-[#f43f5e]/30 rounded-full text-center leading-4 shadow-md shadow-[#f43f5e]/35">
                  {favoriteCount}
                </span>
              )}
            </Link>

            {/* Carrito Dinámico */}
            <Link 
              to="/cart"
              className="p-2 text-slate-400 hover:text-white transition-colors relative cursor-pointer"
            >
              <ShoppingBag className="h-5 w-5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 block min-w-[18px] h-[18px] text-[10px] font-extrabold text-white bg-purple-600 border border-purple-500 rounded-full text-center leading-4 shadow-md shadow-purple-600/30">
                  {cartItemCount}
                </span>
              )}
            </Link>
            
            {currentUser ? (
              <div className="flex items-center space-x-3 bg-slate-950/40 border border-slate-800 rounded-xl px-3 py-1.5">
                <Link to="/profile" className="flex flex-col text-right hover:text-purple-400 transition-colors group cursor-pointer">
                  <span className="text-xs text-slate-400 group-hover:text-purple-300">Hola,</span>
                  <span className="text-xs font-bold text-white group-hover:text-purple-400 max-w-[120px] truncate">
                    {userProfile?.name || currentUser.email}
                  </span>
                </Link>
                
                <button
                  onClick={handleLogout}
                  title="Cerrar sesión"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-900 transition-all cursor-pointer"
                >
                  <LogOut className="h-4.5 w-4.5" />
                </button>
              </div>
            ) : (
              <Link to="/auth/login">
                <Button variant="outline" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  Iniciar Sesión
                </Button>
              </Link>
            )}
          </div>

          {/* Botón de Menú Hamburguesa Móvil */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 focus:outline-none cursor-pointer"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Menú de Navegación Móvil */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800/80 bg-[#0b0f19] px-4 pt-2 pb-4 space-y-2 text-left">
          <Link
            to="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800/40"
          >
            Inicio
          </Link>
          <Link
            to="/products"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800/40"
          >
            Productos
          </Link>
          <Link
            to="/combos"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800/40"
          >
            Combos
          </Link>
          {currentUser && isAdmin && (
            <Link
              to="/admin"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2 rounded-md text-base font-medium text-purple-400 hover:text-purple-300 hover:bg-slate-850/40 flex items-center space-x-2"
            >
              <ShieldCheck className="h-4.5 w-4.5" />
              <span>Panel Admin</span>
            </Link>
          )}

          {/* Bloque de Usuario Móvil */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <Link 
              to="/cart"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center space-x-2 text-slate-300 px-3 w-full"
            >
              <ShoppingBag className="h-5 w-5 text-purple-400" />
              <span>Carrito ({cartItemCount})</span>
            </Link>

            <Link 
              to={currentUser ? "/profile" : "/auth/login"}
              state={currentUser ? { activeTab: 'favorites' } : null}
              onClick={(e) => {
                setIsMobileMenuOpen(false);
                if (!currentUser) {
                  e.preventDefault();
                  if (window.confirm('Debes iniciar sesión para acceder a tus favoritos. ¿Deseas iniciar sesión ahora?')) {
                    navigate('/auth/login');
                  }
                }
              }}
              className="flex items-center space-x-2 text-slate-300 px-3 w-full"
            >
              <Heart className="h-5 w-5 text-[#f43f5e]" />
              <span>Favoritos ({favoriteCount})</span>
            </Link>
            
            {currentUser ? (
              <div className="px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-xl flex items-center justify-between">
                <Link 
                  to="/profile" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex flex-col text-left cursor-pointer group"
                >
                  <span className="text-xs text-slate-500 group-hover:text-purple-400">Sesión iniciada</span>
                  <span className="text-sm font-bold text-white group-hover:text-purple-400 truncate max-w-[180px]">
                    {userProfile?.name || currentUser.email}
                  </span>
                </Link>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1.5 text-xs text-red-400 font-bold uppercase hover:bg-red-500/10 px-2.5 py-1.5 rounded-lg transition-all"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Salir</span>
                </button>
              </div>
            ) : (
              <div className="px-3">
                <Link to="/auth/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="primary" size="sm" className="w-full">Ingresar</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

function Footer() {
  const { config } = useConfig();
  const whatsappUrl = config?.contact?.whatsappNumber 
    ? `https://wa.me/${config.contact.whatsappNumber.replace(/[^0-9]/g, '')}`
    : '#';

  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/60 py-12 text-slate-400 text-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-2.5">
          <div className="w-6 h-6 rounded-full overflow-hidden border border-[#00d2ff]/40 shadow-[0_0_8px_rgba(0,210,255,0.2)] bg-slate-950 flex items-center justify-center p-0.5">
            <img src={config?.branding?.logoUrl || "/images/logo.png"} alt="Mini Logo" className="w-full h-full object-contain" />
          </div>
          <span className="font-bold tracking-wider text-slate-200 text-xs">
            {config?.branding?.siteName || "ETHEREAL VAPES WEB"}
          </span>
        </div>
        <p>{config?.legal?.copyright || "© 2026 Ethereal Vapes. Todos los derechos reservados."}</p>
        <div className="flex space-x-6">
          <a href={config?.legal?.privacyUrl || "#"} className="hover:text-purple-400 transition-colors">Privacidad</a>
          <a href={config?.legal?.termsUrl || "#"} className="hover:text-purple-400 transition-colors">Términos</a>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="hover:text-purple-400 transition-colors">Contacto</a>
        </div>
      </div>
    </footer>
  );
}

function MainLayout() {
  return (
    <div className="min-h-screen text-slate-100 font-sans selection:bg-rose-500/30 selection:text-rose-300 flex flex-col justify-between relative">
      {/* Fondo de Topografía y Luces Neón */}
      <GlowingBackground />

      <div className="w-full">
        {/* Barra Superior de Anuncios y Promociones */}
        <AnnouncementBar />

        {/* Barra de Navegación Reutilizable */}
        <NavigationBar />

        {/* Contenido Principal Administrado por el Enrutador */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <AppRoutes />
        </main>
      </div>

      {/* Toasts de Notificación Globales */}
      <NotificationToast />

      {/* Barra Lateral Flotante de Categorías */}
      <FloatingSidebar />

      {/* Footer Cohesivo */}
      <Footer />
    </div>
  );
}

function App() {
  return (
    <ConfigProvider>
      <AuthProvider>
        <CartProvider>
          <Router>
            <MainLayout />
          </Router>
        </CartProvider>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;
