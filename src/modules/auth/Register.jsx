import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles 
} from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const { register, parseAuthError } = useAuth();
  
  // Estados del formulario
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  
  // Estados visuales y de carga
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Manejo de Validaciones idénticas a Flutter
  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // 1. Nombre Completo
    if (!name.trim()) {
      setErrorMsg('Por favor ingresa tu nombre completo.');
      return;
    }
    const nameParts = name.trim().split(/\s+/);
    if (nameParts.length < 2) {
      setErrorMsg('Por favor ingresa tu nombre y apellido (mínimo 2 palabras).');
      return;
    }
    if (name.trim().length < 5) {
      setErrorMsg('El nombre debe tener al menos 5 caracteres.');
      return;
    }

    // 2. Email
    if (!email.trim()) {
      setErrorMsg('Por favor ingresa tu correo electrónico.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMsg('Por favor ingresa un correo electrónico válido.');
      return;
    }

    // 3. Celular / WhatsApp
    if (!phone.trim()) {
      setErrorMsg('Por favor ingresa tu número de celular.');
      return;
    }
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 7 || phoneDigits.length > 15) {
      setErrorMsg('El número de celular debe tener entre 7 y 15 dígitos.');
      return;
    }

    // 4. Contraseña
    if (!password) {
      setErrorMsg('Por favor ingresa una contraseña.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    // Registro en Firebase
    setLoading(true);
    try {
      await register(email, password, name, phone);
      setSuccessMsg('¡Cuenta creada con éxito! Redirigiendo al inicio...');
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      console.error('Error durante el registro:', err);
      setErrorMsg(parseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto my-6 px-4">
      {/* Botón de Regresar */}
      <div className="flex justify-start mb-6">
        <button 
          onClick={() => navigate(-1)} 
          className="inline-flex items-center space-x-2 text-sm text-slate-400 hover:text-white transition-colors cursor-pointer group"
        >
          <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" />
          <span>Volver</span>
        </button>
      </div>

      {/* Card de Registro */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-purple-500/5 relative overflow-hidden">
        {/* Luces de fondo de neon */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Encabezado */}
        <div className="text-center mb-8 relative">
          <div className="inline-flex p-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl mb-4">
            <Sparkles className="h-6 w-6 text-purple-400 animate-pulse" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-widest bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent uppercase">
            Crear Cuenta
          </h2>
          <p className="text-slate-400 text-sm mt-2 font-normal">
            Únete a la experiencia premium de Ethereal
          </p>
        </div>

        {/* Mensajes de Alerta */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start space-x-3 animate-fadeIn">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <span className="text-left font-medium leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-start space-x-3 animate-fadeIn">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <span className="text-left font-medium leading-relaxed">{successMsg}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleRegister} className="space-y-5 text-left">
          
          {/* Nombre Completo */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Nombre Completo
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <User className="h-5 w-5" />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Karen Sanchez"
                disabled={loading}
                className="w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all text-sm"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Mail className="h-5 w-5" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@correo.com"
                disabled={loading}
                className="w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all text-sm"
              />
            </div>
          </div>

          {/* Celular */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Celular / WhatsApp
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Phone className="h-5 w-5" />
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+57 300 000 0000"
                disabled={loading}
                className="w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all text-sm"
              />
            </div>
          </div>

          {/* Contraseña */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Lock className="h-5 w-5" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                className="w-full pl-10 pr-10 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 focus:outline-none cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>


          {/* Botón de Envío */}
          <div className="pt-4">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading}
              className="w-full shadow-lg shadow-purple-500/10 cursor-pointer"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  <span>Creando cuenta...</span>
                </div>
              ) : (
                'Registrarse Ahora'
              )}
            </Button>
          </div>
        </form>

        {/* Footer del card */}
        <div className="mt-8 text-center border-t border-slate-800/80 pt-6">
          <p className="text-slate-400 text-sm">
            ¿Ya tienes cuenta?{' '}
            <Link 
              to="/auth/login" 
              className="text-purple-400 font-bold hover:text-purple-300 transition-colors"
            >
              Inicia Sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
