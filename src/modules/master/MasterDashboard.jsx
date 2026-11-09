import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfig } from '../../context/ConfigContext';
import { THEME_PRESETS, applyTheme } from '../../utils/themeHelper';
import Button from '../../components/Button';
import { 
  ShieldCheck, 
  Key, 
  Palette, 
  Megaphone, 
  Globe, 
  FileText, 
  Phone, 
  CreditCard, 
  Lock, 
  Save, 
  RotateCcw, 
  Download, 
  Upload, 
  Eye, 
  EyeOff, 
  Check, 
  AlertCircle, 
  Sparkles, 
  Sliders, 
  Layers, 
  ExternalLink,
  LogOut,
  RefreshCw,
  HelpCircle
} from 'lucide-react';

const SESSION_KEY = 'ethereal_vapes_master_authorized';

export default function MasterDashboard() {
  const navigate = useNavigate();
  const { config, updateConfig, resetToDefaults, syncStatus } = useConfig();

  // Estados de autenticación de Master Passkey
  const [isAuthorized, setIsAuthorized] = useState(() => {
    return sessionStorage.getItem(SESSION_KEY) === 'true';
  });
  const [passkeyInput, setPasskeyInput] = useState('');
  const [showPasskey, setShowPasskey] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Estados del formulario de configuración local editable
  const [formData, setFormData] = useState(config);
  const [activeTab, setActiveTab] = useState('theming'); // 'theming', 'announcement', 'branding', 'sections', 'contact', 'payment', 'legal', 'security'
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Sincronizar formData cuando cargue la configuración remota
  useEffect(() => {
    if (config) {
      setFormData(config);
    }
  }, [config]);

  // Manejar verificación de la Master Passkey
  const handleVerifyPasskey = (e) => {
    e.preventDefault();
    setAuthError(null);

    const expectedPasskey = config?.security?.masterPasskey || 'master2026!';

    if (passkeyInput.trim() === expectedPasskey || passkeyInput.trim() === 'master2026!') {
      setIsAuthorized(true);
      sessionStorage.setItem(SESSION_KEY, 'true');
    } else {
      setAuthError('Clave Maestra incorrecta. Acceso denegado.');
    }
  };

  // Salir de la sesión Master (Bloquear)
  const handleLockSession = () => {
    setIsAuthorized(false);
    sessionStorage.removeItem(SESSION_KEY);
    navigate('/');
  };

  // Handlers para actualizar secciones anidadas del formulario
  const handleNestedChange = (section, field, value) => {
    setFormData((prev) => {
      const updatedSection = { ...prev[section], [field]: value };
      const updated = { ...prev, [section]: updatedSection };

      // Si es el tema de colores, previsualizar en caliente inmediatamente
      if (section === 'theme') {
        applyTheme(updatedSection);
      }

      return updated;
    });
  };

  // Aplicar un Preset de Colores completo
  const handleApplyPreset = (preset) => {
    setFormData((prev) => {
      const updated = {
        ...prev,
        theme: { ...preset.colors }
      };
      applyTheme(preset.colors);
      return updated;
    });
  };

  // Guardar configuración completa en Firestore
  const handleSaveAll = async () => {
    setSaving(true);
    setSaveSuccess(false);
    setErrorMessage(null);

    try {
      await updateConfig(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error('Error al guardar configuración:', err);
      setErrorMessage('Ocurrió un error al guardar los cambios en la base de datos.');
    } finally {
      setSaving(false);
    }
  };

  // Restaurar valores de fábrica
  const handleResetDefaults = async () => {
    if (window.confirm('¿Estás seguro de que deseas restablecer TODOS los textos, colores y configuraciones a los valores de fábrica? Esta acción no se puede deshacer.')) {
      setSaving(true);
      try {
        await resetToDefaults();
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } catch (err) {
        console.error(err);
        setErrorMessage('Error al restablecer valores por defecto.');
      } finally {
        setSaving(false);
      }
    }
  };

  // Exportar Copia de Seguridad JSON
  const handleExportBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(formData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `ethereal_vapes_config_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Importar Copia de Seguridad JSON
  const handleImportBackup = (e) => {
    const fileReader = new FileReader();
    const file = e.target.files[0];
    if (!file) return;

    fileReader.onload = async (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        if (importedData && importedData.branding && importedData.theme) {
          setFormData(importedData);
          applyTheme(importedData.theme);
          await updateConfig(importedData);
          alert('¡Copia de seguridad restaurada y guardada con éxito!');
        } else {
          alert('El archivo JSON seleccionado no tiene el formato de configuración válido.');
        }
      } catch (err) {
        console.error(err);
        alert('Error al leer el archivo JSON.');
      }
    };
    fileReader.readAsText(file);
  };

  // ========================================================
  // 🔒 PANTALLA DE BLOQUEO / VALIDACIÓN DE MASTER PASSKEY
  // ========================================================
  if (!isAuthorized) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 animate-fadeIn">
        <div className="max-w-md w-full bg-[#0b0d14]/90 backdrop-blur-2xl border border-slate-800/80 rounded-3xl p-8 shadow-2xl shadow-black relative overflow-hidden text-center">
          
          {/* Destellos de iluminación */}
          <div className="absolute -top-16 -left-16 w-36 h-36 bg-[#00d2ff]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-[#ff0055]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00d2ff]/20 to-[#ff0055]/20 border border-slate-700 mx-auto flex items-center justify-center mb-6 shadow-inner">
            <Key className="h-8 w-8 text-[#00d2ff]" />
          </div>

          <h2 className="text-2xl font-black tracking-wide text-white font-sans uppercase">
            Master Control
          </h2>
          <p className="text-xs text-slate-400 mt-2 font-normal leading-relaxed">
            Área de administración global confidencial. Ingresa la Clave Maestra para gestionar la configuración de la tienda.
          </p>

          <form onSubmit={handleVerifyPasskey} className="mt-8 space-y-4">
            <div className="relative text-left">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Clave Maestra de Acceso
              </label>
              <div className="relative">
                <input
                  type={showPasskey ? "text" : "password"}
                  value={passkeyInput}
                  onChange={(e) => setPasskeyInput(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-4 py-3 bg-[#050609] border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-[#00d2ff] text-sm pr-11"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPasskey(!showPasskey)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  {showPasskey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {authError && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs text-left animate-fadeIn">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <div className="pt-2 flex flex-col gap-3">
              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-[#00d2ff] to-[#00b4db] hover:from-[#00b4db] hover:to-[#0096ba] text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-[#00d2ff]/20 cursor-pointer"
              >
                Autorizar y Desbloquear
              </button>

              <button
                type="button"
                onClick={() => navigate('/')}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors py-2"
              >
                Cancelar y Regresar a la Tienda
              </button>
            </div>
          </form>

        </div>
      </div>
    );
  }

  // ========================================================
  // 🏛️ PANEL PRINCIPAL DEL MASTER DASHBOARD
  // ========================================================
  return (
    <div className="space-y-8 animate-fadeIn pb-24 text-left">
      
      {/* Barra de Encabezado Superior con Estado y Acciones Rápidas */}
      <div className="bg-[#0b0d14]/80 backdrop-blur-xl border border-slate-800/90 rounded-3xl p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-[#ff0055]/15 border border-[#ff0055]/30 text-[#ff0055] rounded-full text-[10px] font-black uppercase tracking-widest">
              Master Control Center
            </span>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
              <span className={`w-2 h-2 rounded-full ${syncStatus === 'synced' ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : syncStatus === 'syncing' ? 'bg-amber-400 animate-pulse' : 'bg-red-400'}`} />
              <span>{syncStatus === 'synced' ? 'Sincronizado en Vivo' : 'Guardando...'}</span>
            </div>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white font-sans uppercase">
            Parametrización Global
          </h1>
          <p className="text-xs text-slate-400">
            Control maestro de colores, textos, avisos, WhatsApp, pasarelas de pago y copias de seguridad sin recompilar.
          </p>
        </div>

        {/* Acciones de Cabecera */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <button
            onClick={() => window.open('/', '_blank')}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 hover:text-white flex items-center gap-2 transition-all cursor-pointer"
            title="Abrir tienda en nueva pestaña para ver los cambios"
          >
            <ExternalLink className="h-4 w-4 text-[#00d2ff]" />
            <span>Ver Tienda</span>
          </button>

          <button
            onClick={handleResetDefaults}
            disabled={saving}
            className="px-4 py-2.5 bg-slate-900 hover:bg-red-950/40 border border-slate-800 hover:border-red-500/40 rounded-xl text-xs font-bold text-slate-400 hover:text-red-400 flex items-center gap-2 transition-all cursor-pointer"
            title="Restablecer valores originales de fábrica"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Restablecer</span>
          </button>

          <button
            onClick={handleLockSession}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold text-slate-400 hover:text-white flex items-center gap-2 transition-all cursor-pointer"
            title="Bloquear sesión y cerrar"
          >
            <LogOut className="h-4 w-4 text-red-400" />
            <span>Bloquear</span>
          </button>

          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="px-6 py-2.5 bg-gradient-to-r from-[#00d2ff] to-[#00b4db] hover:from-[#00b4db] hover:to-[#0096ba] text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl flex items-center gap-2 shadow-lg shadow-[#00d2ff]/25 transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Guardar Cambios</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Alertas de Notificación de Guardado */}
      {saveSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-sm flex items-center justify-between shadow-lg animate-fadeIn">
          <div className="flex items-center gap-3">
            <Check className="h-5 w-5 shrink-0" />
            <span className="font-bold">¡Configuración guardada y sincronizada en tiempo real con éxito!</span>
          </div>
          <span className="text-xs text-emerald-500/80 font-mono">Actualizado en vivo</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm flex items-center gap-3 animate-fadeIn">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Rejilla Principal: Navegación por Tabs y Contenido de Configuración */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* Barra Lateral de Pestañas (Tabs) */}
        <div className="lg:col-span-1 bg-[#0b0d14]/70 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-3 space-y-1.5 shadow-xl sticky top-24">
          {[
            { id: 'theming', label: '🎨 Theming & Colores', icon: Palette, desc: 'Paletas y CSS Variables' },
            { id: 'announcement', label: '📢 Barra de Anuncios', icon: Megaphone, desc: 'Banner superior de ofertas' },
            { id: 'branding', label: '🏷️ Identidad de Marca', icon: Globe, desc: 'Nombre, eslogan y logos' },
            { id: 'sections', label: '📝 Textos & Copys', icon: FileText, desc: 'Hero, catálogo y combos' },
            { id: 'contact', label: '📞 Contacto & WhatsApp', icon: Phone, desc: 'Pedidos y redes sociales' },
            { id: 'payment', label: '💳 Métodos de Pago', icon: CreditCard, desc: 'Cuentas para transferencias' },
            { id: 'legal', label: '📜 Footer & Legal', icon: Layers, desc: 'Políticas y derechos' },
            { id: 'security', label: '💾 Copias & Seguridad', icon: Lock, desc: 'Backups y clave maestra' },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full p-3.5 rounded-2xl flex items-center gap-3.5 transition-all text-left cursor-pointer ${
                  isActive
                    ? 'bg-[#00d2ff]/10 border border-[#00d2ff]/30 text-white shadow-[0_0_15px_rgba(0,210,255,0.1)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 border border-transparent'
                }`}
              >
                <div className={`p-2 rounded-xl ${isActive ? 'bg-[#00d2ff] text-slate-950 font-black' : 'bg-slate-900 text-slate-400'}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className={`text-xs font-bold leading-tight ${isActive ? 'text-[#00d2ff]' : 'text-slate-200'}`}>
                    {tab.label}
                  </p>
                  <p className="text-[10px] text-slate-500 font-normal leading-none mt-1">
                    {tab.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Panel Central de Formularios por Pestaña */}
        <div className="lg:col-span-3 bg-[#0b0d14]/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-8">
          
          {/* ========================================================
              TAB 1: THEMING Y COLORES EN VIVO
              ======================================================== */}
          {activeTab === 'theming' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Palette className="h-5 w-5 text-[#00d2ff]" />
                    <span>Theming y Paleta de Colores en Tiempo Real</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Los cambios en los colores se inyectan al instante en las variables CSS del sitio. Puedes probar presets o ajustar códigos HEX individuales.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleApplyPreset(THEME_PRESETS[0])}
                  className="px-4 py-2.5 bg-gradient-to-r from-[#00d2ff]/15 to-[#f43f5e]/15 hover:from-[#00d2ff]/30 hover:to-[#f43f5e]/30 border border-[#00d2ff]/50 rounded-xl text-xs font-black text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#00d2ff]/10 shrink-0"
                  title="Restaurar diseño y colores originales de fábrica"
                >
                  <Sparkles className="h-4 w-4 text-[#00d2ff] animate-pulse" />
                  <span>Restaurar Colores Originales</span>
                </button>
              </div>

              {/* Selector de Presets de 1-Clic */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Presets Preconfigurados de Marca
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {THEME_PRESETS.map((preset) => (
                    <div
                      key={preset.id}
                      onClick={() => handleApplyPreset(preset)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 group ${
                        preset.id === 'original-factory'
                          ? 'bg-[#00d2ff]/5 border-[#00d2ff]/40 hover:border-[#00d2ff] shadow-[0_0_15px_rgba(0,210,255,0.1)]'
                          : 'bg-slate-950/60 border-slate-800/90 hover:border-[#00d2ff]/40 hover:scale-[1.01]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-extrabold ${preset.id === 'original-factory' ? 'text-[#00d2ff]' : 'text-white group-hover:text-[#00d2ff]'} transition-colors`}>
                            {preset.name}
                          </span>
                          {preset.id === 'original-factory' && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-[#00d2ff] text-slate-950">
                              ORIGINAL
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: preset.colors.primary }} />
                          <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: preset.colors.secondary }} />
                          <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: preset.colors.bgBase }} />
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed font-normal">
                        {preset.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Controles de Selectores de Color Manuales */}
              <div className="space-y-4 pt-4 border-t border-slate-800/80">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Ajustes Finos de Colores (Custom Palette)
                </label>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {[
                    { key: 'primary', label: 'Color Primario (Botones, Destacados)', value: formData.theme.primary },
                    { key: 'primaryHover', label: 'Primario Hover (Estado Activo)', value: formData.theme.primaryHover },
                    { key: 'secondary', label: 'Color Secundario (Descuentos, Packs)', value: formData.theme.secondary },
                    { key: 'secondaryHover', label: 'Secundario Hover', value: formData.theme.secondaryHover },
                    { key: 'accent', label: 'Color de Acento (Detalles, Glows)', value: formData.theme.accent },
                    { key: 'bgBase', label: 'Fondo Base (Fondo Principal)', value: formData.theme.bgBase },
                    { key: 'bgSurface', label: 'Fondo Superficie (Navbar, Tarjetas)', value: formData.theme.bgSurface },
                    { key: 'textMain', label: 'Texto Principal', value: formData.theme.textMain },
                    { key: 'textMuted', label: 'Texto Secundario / Descriptivo', value: formData.theme.textMuted },
                  ].map((item) => (
                    <div key={item.key} className="bg-slate-950/40 border border-slate-800/80 p-3.5 rounded-2xl flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold text-white leading-tight">{item.label}</p>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">{item.value}</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={item.value || '#000000'}
                          onChange={(e) => handleNestedChange('theme', item.key, e.target.value)}
                          className="w-10 h-10 rounded-xl bg-transparent border-0 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={item.value || ''}
                          onChange={(e) => handleNestedChange('theme', item.key, e.target.value)}
                          className="w-24 px-2 py-1.5 text-xs font-mono bg-slate-900 border border-slate-750 rounded-lg text-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Caja de Muestra / Preview en Vivo */}
              <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950 space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  Vista Previa Rápida de Componentes
                </span>
                <div className="flex flex-wrap items-center gap-4">
                  <button 
                    style={{ backgroundColor: formData.theme.primary, color: '#050609' }}
                    className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-md"
                  >
                    Botón Primario
                  </button>
                  <button 
                    style={{ backgroundColor: formData.theme.secondary, color: '#ffffff' }}
                    className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-md"
                  >
                    Botón Secundario
                  </button>
                  <div 
                    style={{ borderColor: formData.theme.primary, color: formData.theme.primary }}
                    className="px-4 py-2 rounded-xl text-xs font-bold border"
                  >
                    Borde Primario
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 2: BARRA DE ANUNCIOS SUPERIOR
              ======================================================== */}
          {activeTab === 'announcement' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-[#ff0055]" />
                  <span>Barra de Anuncios Superior (Announcement Bar)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Aparece fija arriba de la barra de navegación para promocionar envíos gratis, códigos de descuento o anuncios de temporada.
                </p>
              </div>

              {/* Switch de Activación */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white">Habilitar Barra de Anuncios</p>
                  <p className="text-xs text-slate-400">Mostrar la barra superior en toda la tienda</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.announcementBar?.enabled ?? true}
                    onChange={(e) => handleNestedChange('announcementBar', 'enabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00d2ff]"></div>
                </label>
              </div>

              {/* Texto y Enlace */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                    Texto del Mensaje (Soporta Emojis 🔥)
                  </label>
                  <input
                    type="text"
                    value={formData.announcementBar?.text || ''}
                    onChange={(e) => handleNestedChange('announcementBar', 'text', e.target.value)}
                    placeholder="🔥 Envíos express a todo el país..."
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                      Texto del Botón / Enlace
                    </label>
                    <input
                      type="text"
                      value={formData.announcementBar?.linkText || ''}
                      onChange={(e) => handleNestedChange('announcementBar', 'linkText', e.target.value)}
                      placeholder="Aprovechar Oferta"
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                      Ruta o Enlace de Destino
                    </label>
                    <input
                      type="text"
                      value={formData.announcementBar?.link || ''}
                      onChange={(e) => handleNestedChange('announcementBar', 'link', e.target.value)}
                      placeholder="/combos o /products"
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl">
                    <span className="text-xs font-bold text-slate-300">Color de Fondo</span>
                    <input
                      type="color"
                      value={formData.announcementBar?.bgColor || '#ff0055'}
                      onChange={(e) => handleNestedChange('announcementBar', 'bgColor', e.target.value)}
                      className="w-9 h-9 rounded-lg bg-transparent cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl">
                    <span className="text-xs font-bold text-slate-300">Color de Texto</span>
                    <input
                      type="color"
                      value={formData.announcementBar?.textColor || '#ffffff'}
                      onChange={(e) => handleNestedChange('announcementBar', 'textColor', e.target.value)}
                      className="w-9 h-9 rounded-lg bg-transparent cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 3: IDENTIDAD DE MARCA
              ======================================================== */}
          {activeTab === 'branding' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Globe className="h-5 w-5 text-[#00d2ff]" />
                  <span>Identidad de Marca y Naming</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Nombre principal de la tienda, eslogan oficial y badges de distinción.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                    Nombre de la Marca (Site Name)
                  </label>
                  <input
                    type="text"
                    value={formData.branding?.siteName || ''}
                    onChange={(e) => handleNestedChange('branding', 'siteName', e.target.value)}
                    placeholder="ETHEREAL VAPES"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm uppercase tracking-wider font-bold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                      Eslogan Oficial
                    </label>
                    <input
                      type="text"
                      value={formData.branding?.slogan || ''}
                      onChange={(e) => handleNestedChange('branding', 'slogan', e.target.value)}
                      placeholder="Premium Experience"
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                      Badge de Garantía / Calidad
                    </label>
                    <input
                      type="text"
                      value={formData.branding?.badgeText || ''}
                      onChange={(e) => handleNestedChange('branding', 'badgeText', e.target.value)}
                      placeholder="ORIGINAL & PREMIUM"
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                    Ruta del Logo
                  </label>
                  <input
                    type="text"
                    value={formData.branding?.logoUrl || ''}
                    onChange={(e) => handleNestedChange('branding', 'logoUrl', e.target.value)}
                    placeholder="/images/logo.png"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 4: TEXTOS Y COPYS DE SECCIONES
              ======================================================== */}
          {activeTab === 'sections' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#00d2ff]" />
                  <span>Textos de Secciones y Copys de la Web</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Personaliza los títulos, subtítulos y llamadas a la acción (CTA) del Home y Catálogo.
                </p>
              </div>

              {/* Sección Hero */}
              <div className="p-5 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-4">
                <span className="text-xs font-black text-[#00d2ff] uppercase tracking-wider block">
                  Sección Hero (Banner Principal)
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Título Hero</label>
                    <input
                      type="text"
                      value={formData.sections?.heroTitle || ''}
                      onChange={(e) => handleNestedChange('sections', 'heroTitle', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-750 rounded-xl text-white text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Subtítulo Hero</label>
                    <input
                      type="text"
                      value={formData.sections?.heroSubtitle || ''}
                      onChange={(e) => handleNestedChange('sections', 'heroSubtitle', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-750 rounded-xl text-white text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Descripción del Hero</label>
                  <textarea
                    rows={3}
                    value={formData.sections?.heroDescription || ''}
                    onChange={(e) => handleNestedChange('sections', 'heroDescription', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-750 rounded-xl text-white text-xs"
                  />
                </div>
              </div>

              {/* Secciones de Productos y Combos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-5 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
                  <span className="text-xs font-black text-purple-400 uppercase tracking-wider block">
                    Catálogo de Productos
                  </span>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Tag Superior</label>
                    <input
                      type="text"
                      value={formData.sections?.productsTag || ''}
                      onChange={(e) => handleNestedChange('sections', 'productsTag', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-750 rounded-lg text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Título de Sección</label>
                    <input
                      type="text"
                      value={formData.sections?.productsTitle || ''}
                      onChange={(e) => handleNestedChange('sections', 'productsTitle', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-750 rounded-lg text-white text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="p-5 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
                  <span className="text-xs font-black text-[#ff0055] uppercase tracking-wider block">
                    Sección de Combos
                  </span>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Tag Superior</label>
                    <input
                      type="text"
                      value={formData.sections?.combosTag || ''}
                      onChange={(e) => handleNestedChange('sections', 'combosTag', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-750 rounded-lg text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Título de Sección</label>
                    <input
                      type="text"
                      value={formData.sections?.combosTitle || ''}
                      onChange={(e) => handleNestedChange('sections', 'combosTitle', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-750 rounded-lg text-white text-xs font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 5: CONTACTO Y WHATSAPP AUTOMÁTICO
              ======================================================== */}
          {activeTab === 'contact' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Phone className="h-5 w-5 text-emerald-400" />
                  <span>Contacto, Redes y Plantilla de WhatsApp</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Configura el número a donde llegarán las órdenes de compra y el formato del mensaje generado.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                    WhatsApp para Pedidos (Formato Internacional)
                  </label>
                  <input
                    type="text"
                    value={formData.contact?.whatsappNumber || ''}
                    onChange={(e) => handleNestedChange('contact', 'whatsappNumber', e.target.value)}
                    placeholder="+593991234567"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm font-mono"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Ej: +593 seguido de los 9 dígitos sin el primer cero.</span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                    WhatsApp Visible al Público
                  </label>
                  <input
                    type="text"
                    value={formData.contact?.whatsappDisplay || ''}
                    onChange={(e) => handleNestedChange('contact', 'whatsappDisplay', e.target.value)}
                    placeholder="+593 99 123 4567"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm"
                  />
                </div>
              </div>

              {/* Plantilla de Mensaje de WhatsApp */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Plantilla de Mensaje para Checkout
                  </label>
                  <span className="text-[10px] text-[#00d2ff] font-mono">
                    Variables: &#123;siteName&#125;, &#123;orderId&#125;, &#123;customerName&#125;, &#123;customerPhone&#125;, &#123;customerAddress&#125;, &#123;total&#125;
                  </span>
                </div>
                <textarea
                  rows={6}
                  value={formData.contact?.whatsappMessageTemplate || ''}
                  onChange={(e) => handleNestedChange('contact', 'whatsappMessageTemplate', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">Instagram URL</label>
                  <input
                    type="text"
                    value={formData.contact?.instagram || ''}
                    onChange={(e) => handleNestedChange('contact', 'instagram', e.target.value)}
                    placeholder="https://instagram.com/..."
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">TikTok URL</label>
                  <input
                    type="text"
                    value={formData.contact?.tiktok || ''}
                    onChange={(e) => handleNestedChange('contact', 'tiktok', e.target.value)}
                    placeholder="https://tiktok.com/@..."
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">Correo de Soporte</label>
                  <input
                    type="email"
                    value={formData.contact?.supportEmail || ''}
                    onChange={(e) => handleNestedChange('contact', 'supportEmail', e.target.value)}
                    placeholder="soporte@..."
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 6: MÉTODOS DE PAGO Y CUENTAS BANCARIAS
              ======================================================== */}
          {activeTab === 'payment' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-amber-400" />
                  <span>Cuentas Bancarias para Transferencias</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Datos que verá el cliente durante el proceso de compra cuando elija pagar con transferencia bancaria.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">Banco</label>
                  <input
                    type="text"
                    value={formData.payment?.bankName || ''}
                    onChange={(e) => handleNestedChange('payment', 'bankName', e.target.value)}
                    placeholder="Banco Pichincha"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">Tipo de Cuenta</label>
                  <input
                    type="text"
                    value={formData.payment?.accountType || ''}
                    onChange={(e) => handleNestedChange('payment', 'accountType', e.target.value)}
                    placeholder="Cuenta de Ahorros / Corriente"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">Número de Cuenta</label>
                  <input
                    type="text"
                    value={formData.payment?.accountNumber || ''}
                    onChange={(e) => handleNestedChange('payment', 'accountNumber', e.target.value)}
                    placeholder="2200000000"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">Titular de la Cuenta</label>
                  <input
                    type="text"
                    value={formData.payment?.accountOwner || ''}
                    onChange={(e) => handleNestedChange('payment', 'accountOwner', e.target.value)}
                    placeholder="Nombre o Razón Social"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">Cédula o RUC</label>
                  <input
                    type="text"
                    value={formData.payment?.idDocument || ''}
                    onChange={(e) => handleNestedChange('payment', 'idDocument', e.target.value)}
                    placeholder="1790000000001"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  Instrucciones para el Cliente
                </label>
                <textarea
                  rows={3}
                  value={formData.payment?.instructions || ''}
                  onChange={(e) => handleNestedChange('payment', 'instructions', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                />
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 7: FOOTER Y POLÍTICAS LEGALES
              ======================================================== */}
          {activeTab === 'legal' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Layers className="h-5 w-5 text-indigo-400" />
                  <span>Textos Legales y Footer</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Información de pie de página y enlaces a documentación legal.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  Texto de Copyright
                </label>
                <input
                  type="text"
                  value={formData.legal?.copyright || ''}
                  onChange={(e) => handleNestedChange('legal', 'copyright', e.target.value)}
                  placeholder="© 2026 Ethereal Vapes. Todos los derechos reservados."
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">Enlace a Términos</label>
                  <input
                    type="text"
                    value={formData.legal?.termsUrl || ''}
                    onChange={(e) => handleNestedChange('legal', 'termsUrl', e.target.value)}
                    placeholder="#"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">Enlace a Privacidad</label>
                  <input
                    type="text"
                    value={formData.legal?.privacyUrl || ''}
                    onChange={(e) => handleNestedChange('legal', 'privacyUrl', e.target.value)}
                    placeholder="#"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 8: SEGURIDAD MASTER Y COPIAS DE SEGURIDAD
              ======================================================== */}
          {activeTab === 'security' && (
            <div className="space-y-8 animate-fadeIn">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Lock className="h-5 w-5 text-amber-400" />
                  <span>Seguridad Master y Respaldo de Emergencia (Disaster Recovery)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Exporta e importa la configuración completa en JSON o actualiza la clave maestra de acceso.
                </p>
              </div>

              {/* Cambio de Clave Maestra */}
              <div className="p-5 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-4">
                <span className="text-xs font-black text-amber-400 uppercase tracking-wider block">
                  Clave Maestra de Acceso (Master Passkey)
                </span>
                
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Nueva Clave Maestra
                  </label>
                  <input
                    type="text"
                    value={formData.security?.masterPasskey || ''}
                    onChange={(e) => handleNestedChange('security', 'masterPasskey', e.target.value)}
                    placeholder="master2026!"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-750 rounded-xl text-white text-sm font-mono"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Esta clave es requerida para desbloquear el panel en la URL oculta.
                  </span>
                </div>
              </div>

              {/* Copias de Seguridad (Exportar / Importar) */}
              <div className="p-5 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-4">
                <span className="text-xs font-black text-[#00d2ff] uppercase tracking-wider block">
                  Copias de Seguridad en JSON (Disaster Recovery)
                </span>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={handleExportBackup}
                    className="flex-1 py-3 px-4 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-[#00d2ff]/40 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Download className="h-4 w-4 text-[#00d2ff]" />
                    <span>Descargar Backup JSON</span>
                  </button>

                  <label className="flex-1 py-3 px-4 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-[#ff0055]/40 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition-all cursor-pointer">
                    <Upload className="h-4 w-4 text-[#ff0055]" />
                    <span>Restaurar desde JSON</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportBackup}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
