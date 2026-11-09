import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import { 
  Mail, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles 
} from 'lucide-react';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { sendPasswordReset, parseAuthError } = useAuth();
  
  // Estados del formulario
  const [email, setEmail] = useState('');
  
  // Estados visuales y de carga
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Validación del email
    if (!email.trim()) {
      setErrorMsg('Por favor ingresa tu correo electrónico.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMsg('Por favor ingresa un correo electrónico válido.');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordReset(email);
      setSuccessMsg('¡Enlace de recuperación enviado! Por favor revisa tu bandeja de entrada (incluyendo spam).');
      setEmail('');
    } catch (err) {
      console.error('Error al enviar recuperación de contraseña:', err);
      setErrorMsg(parseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto my-12 px-4">
      {/* Botón de Regresar */}
      <div className="flex justify-start mb-6">
        <button 
          onClick={() => navigate('/auth/login')} 
          className="inline-flex items-center space-x-2 text-sm text-slate-400 hover:text-white transition-colors cursor-pointer group"
        >
          <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" />
          <span>Volver al Login</span>
        </button>
      </div>

      {/* Card de Restablecimiento */}
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
            Recuperar Clave
          </h2>
          <p className="text-slate-400 text-sm mt-2 font-normal">
            Ingresa tu correo para recibir un enlace de restauración
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
        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          
          {/* Email */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Correo Electrónico
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

          {/* Botón de Envío */}
          <div className="pt-2">
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
                  <span>Enviando enlace...</span>
                </div>
              ) : (
                'Enviar Enlace de Recuperación'
              )}
            </Button>
          </div>
        </form>

        {/* Footer del card */}
        <div className="mt-8 text-center border-t border-slate-800/80 pt-6">
          <p className="text-slate-400 text-sm">
            ¿Recordaste tu contraseña?{' '}
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
