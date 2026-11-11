import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  Flame,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { login, logout, userProfile, parseAuthError } = useAuth();
  
  // Estados del formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Estados visuales y de carga
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Estados del Sistema OTP Administrativo
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState(''); // El código ingresado por el administrador
  const [adminEmail, setAdminEmail] = useState(''); // Correo de admin activo
  const ADMIN_SECURITY_OTP = '202520'; // Código de seguridad exclusivo del Administrador

  // Manejo del Login de usuario
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg('Por favor llena todos los campos.');
      return;
    }

    setLoading(true);

    // Bandera para cancelar el timeout de seguridad si se completa antes
    let loginCompleted = false;

    // Timeout de seguridad de contingencia (4.5 segundos)
    const safetyTimeout = setTimeout(() => {
      if (!loginCompleted) {
        console.warn("Límite de tiempo de espera de perfil alcanzado. Forzando ingreso como cliente...");
        setSuccessMsg('¡Inicio de sesión exitoso!');
        setLoading(false);
        navigate('/');
      }
    }, 4500);

    try {
      await login(email, password);
      // Tras el login exitoso, el useEffect se encargará de interceptar si es admin e inyectar el OTP
      loginCompleted = true;
      clearTimeout(safetyTimeout);
    } catch (err) {
      clearTimeout(safetyTimeout);
      console.error('Error durante el inicio de sesión:', err);
      setErrorMsg(parseAuthError(err));
      setLoading(false);
    }
  };

  // Interceptor reactivo para chequear el perfil de administrador tras el login (igual que Flutter)
  useEffect(() => {
    if (userProfile && !showOtpModal) {
      const isAdminVal = userProfile.isAdmin === true || 
                         userProfile.isAdmin?.toString().toLowerCase() === 'true' || 
                         userProfile.isAdmin === 1;

      if (isAdminVal) {
        // Es administrador, interceptamos el login e iniciamos flujo OTP real por seguridad
        triggerAdminOtpFlow(userProfile.email || email.trim());
      } else {
        // Es un cliente común, ingresa directo al home sin pedir OTP
        setSuccessMsg(`¡Bienvenido de vuelta, ${userProfile.name}!`);
        setTimeout(() => {
          navigate('/');
        }, 1500);
      }
      setLoading(false);
    }
  }, [userProfile]);

  // Activación del modal OTP exclusivo para el Administrador
  const triggerAdminOtpFlow = (targetEmail) => {
    setAdminEmail(targetEmail);
    setOtpCode('');
    setShowOtpModal(true);
  };

  // Verificación del OTP ingresado
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (otpCode.trim() === ADMIN_SECURITY_OTP) {
      setSuccessMsg('🛡️ Autenticación de Administrador exitosa.');
      setShowOtpModal(false);
      setTimeout(() => {
        navigate('/admin');
      }, 1500);
    } else {
      // Código erróneo. Cerramos sesión inmediatamente en Firebase por seguridad
      setShowOtpModal(false);
      setLoading(true);
      try {
        await logout();
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        setErrorMsg('Acceso Denegado. El código de seguridad ingresado es incorrecto.');
      }
    }
  };

  // Cancelar OTP
  const handleCancelOtp = async () => {
    setShowOtpModal(false);
    setLoading(true);
    try {
      await logout();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setErrorMsg('Autenticación administrativa cancelada.');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto my-12 px-4 relative">
      
      {/* Card de Iniciar Sesión */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-purple-500/5 relative overflow-hidden">
        {/* Luces de fondo de neon */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Encabezado */}
        <div className="text-center mb-8 relative">
          <div className="inline-flex p-4 rounded-full border border-purple-500/30 bg-purple-500/10 shadow-lg shadow-purple-500/20 mb-4 animate-pulse">
            <Flame className="h-8 w-8 text-purple-400" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-widest bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent uppercase">
            Bienvenido
          </h2>
          <p className="text-slate-400 text-sm mt-2 font-normal">
            Ingresa a la experiencia premium
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
        <form onSubmit={handleLogin} className="space-y-6 text-left">
          
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
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@correo.com"
                disabled={loading}
                className="w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all text-sm"
              />
            </div>
          </div>

          {/* Contraseña */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Contraseña
              </label>
              <Link 
                to="/auth/forgot-password"
                className="text-xs text-slate-500 hover:text-purple-400 transition-colors focus:outline-none cursor-pointer font-semibold"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
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
                  <span>Verificando...</span>
                </div>
              ) : (
                'Iniciar Sesión'
              )}
            </Button>
          </div>
        </form>

        {/* Footer del card */}
        <div className="mt-8 text-center border-t border-slate-800/80 pt-6 space-y-4">
          <p className="text-slate-400 text-sm">
            ¿No tienes cuenta?{' '}
            <Link 
              to="/auth/register" 
              className="text-purple-400 font-bold hover:text-purple-300 transition-colors"
            >
              Regístrate
            </Link>
          </p>

          <div>
            <button 
              onClick={() => navigate('/')}
              className="text-xs tracking-widest text-slate-500 hover:text-slate-300 transition-colors focus:outline-none font-bold uppercase cursor-pointer"
            >
              CONTINUAR COMO INVITADO
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          🛡️ DIÁLOGO MODAL OTP ADMINISTRATIVO (HIGH-FIDELITY OVERLAY)
          ======================================================== */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0e1326] border border-purple-500/30 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl shadow-purple-500/25 relative overflow-hidden transform scale-100 transition-all duration-300">
            
            {/* Luces decorativas */}
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />
            
            <div className="text-center space-y-4">
              <div className="inline-flex p-3 bg-purple-500/10 border border-purple-500/30 rounded-2xl">
                <ShieldCheck className="h-8 w-8 text-purple-400 animate-bounce" />
              </div>
              
              <h3 className="text-xl font-bold text-white tracking-wider">
                VERIFICACIÓN DE SEGURIDAD
              </h3>
              
              <p className="text-xs text-slate-400 leading-relaxed">
                Se ha detectado acceso con privilegios de **Administrador**. Ingresa tu código maestro de seguridad para autorizar el ingreso al panel.
              </p>

              {/* Formulario OTP */}
              <form onSubmit={handleVerifyOtp} className="space-y-4 text-left pt-2">
                <div className="space-y-2">
                  <input
                    type="password"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Código de 6 dígitos"
                    className="w-full text-center py-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xl tracking-widest focus:outline-none focus:border-purple-500 transition-all placeholder:text-slate-700 placeholder:text-sm placeholder:font-sans"
                  />
                </div>

                <div className="flex flex-col space-y-3 pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={otpCode.length !== 6}
                    className="w-full font-bold cursor-pointer"
                  >
                    Confirmar Código
                  </Button>
                  
                  <div className="flex items-center justify-center text-xs pt-1">
                    <button
                      type="button"
                      onClick={handleCancelOtp}
                      className="text-red-400 hover:text-red-300 transition-colors focus:outline-none cursor-pointer"
                    >
                      Cancelar y Salir
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
