import React, { useState, useEffect } from 'react';
import Button from '../../../components/Button';
import { useConfig } from '../../../context/ConfigContext';
import {
  Megaphone,
  Save,
  Check,
  Sparkles,
  ArrowRight,
  X,
  Plus,
  Image,
  Edit2,
  Trash2
} from 'lucide-react';

export default function BannersTab({
  banners,
  loadingBanners,
  openCreateBanner,
  openEditBanner,
  deleteBanner
}) {
  const { config, updateConfig } = useConfig();

  const [announcementForm, setAnnouncementForm] = useState({
    enabled: true,
    text: '',
    link: '',
    linkText: '',
    bgColor: '#ff0055',
    textColor: '#ffffff'
  });
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);
  const [announcementSavedSuccess, setAnnouncementSavedSuccess] = useState(false);

  useEffect(() => {
    if (config?.announcementBar) {
      setAnnouncementForm(config.announcementBar);
    }
  }, [config?.announcementBar]);

  const handleSaveAnnouncement = async (e) => {
    if (e) e.preventDefault();
    setSavingAnnouncement(true);
    setAnnouncementSavedSuccess(false);
    try {
      await updateConfig({ announcementBar: announcementForm });
      setAnnouncementSavedSuccess(true);
      setTimeout(() => setAnnouncementSavedSuccess(false), 3500);
    } catch (err) {
      console.error('Error al guardar la barra de anuncios:', err);
      alert('Error al guardar la barra de anuncios.');
    } finally {
      setSavingAnnouncement(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. BARRA SUPERIOR DE ANUNCIOS */}
      <div className="bg-[#0f1424]/60 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-850 pb-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#ff0055]/10 text-[#ff0055]">
                <Megaphone className="h-4 w-4" />
              </span>
              <h3 className="font-extrabold text-white text-base">Barra de Anuncios Superior (Announcement Bar)</h3>
            </div>
            <p className="text-xs text-slate-400">
              Aparece fija arriba de la barra de navegación para promocionar envíos gratis, códigos o avisos de temporada.
            </p>
          </div>

          <Button
            onClick={handleSaveAnnouncement}
            disabled={savingAnnouncement}
            variant="primary"
            size="sm"
            className="bg-[#00d2ff] hover:bg-[#00b4db] text-slate-950 font-black shadow-md flex items-center space-x-2 border-0 cursor-pointer"
          >
            <Save className="h-4 w-4" />
            <span>{savingAnnouncement ? 'Guardando...' : 'Guardar Barra'}</span>
          </Button>
        </div>

        {announcementSavedSuccess && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2 animate-fadeIn">
            <Check className="h-4 w-4 shrink-0" />
            <span className="font-bold">¡Barra de anuncios guardada y actualizada en vivo con éxito!</span>
          </div>
        )}

        {announcementForm.enabled && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              Vista Previa en Vivo:
            </span>
            <div
              style={{ backgroundColor: announcementForm.bgColor || '#ff0055', color: announcementForm.textColor || '#ffffff' }}
              className="py-2 px-4 rounded-xl text-xs font-semibold flex items-center justify-between gap-3 shadow-md transition-all"
            >
              <div className="flex-1 flex flex-wrap items-center justify-center gap-2 text-center">
                <Sparkles className="h-3.5 w-3.5" />
                <span>{announcementForm.text || '🔥 Texto del anuncio...'}</span>
                {announcementForm.linkText && (
                  <span className="underline font-bold inline-flex items-center gap-1">
                    {announcementForm.linkText} <ArrowRight className="h-3 w-3" />
                  </span>
                )}
              </div>
              <X className="h-3.5 w-3.5 opacity-70" />
            </div>
          </div>
        )}

        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-white">Habilitar Barra de Anuncios</p>
            <p className="text-[11px] text-slate-400">Mostrar la barra superior en toda la tienda</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={announcementForm.enabled ?? true}
              onChange={(e) => setAnnouncementForm(prev => ({ ...prev, enabled: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00d2ff]"></div>
          </label>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
              Texto del Mensaje (Soporta Emojis 🔥)
            </label>
            <input
              type="text"
              value={announcementForm.text || ''}
              onChange={(e) => setAnnouncementForm(prev => ({ ...prev, text: e.target.value }))}
              placeholder="🔥 Envíos express a todo el país | Compras mayores a $50 con envío gratis"
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Texto del Botón / Enlace
              </label>
              <input
                type="text"
                value={announcementForm.linkText || ''}
                onChange={(e) => setAnnouncementForm(prev => ({ ...prev, linkText: e.target.value }))}
                placeholder="Aprovechar Oferta"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Ruta o Enlace de Destino
              </label>
              <input
                type="text"
                value={announcementForm.link || ''}
                onChange={(e) => setAnnouncementForm(prev => ({ ...prev, link: e.target.value }))}
                placeholder="/combos o /products"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <span className="text-xs font-bold text-slate-300">Color de Fondo</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={announcementForm.bgColor || '#ff0055'}
                  onChange={(e) => setAnnouncementForm(prev => ({ ...prev, bgColor: e.target.value }))}
                  className="w-8 h-8 rounded-lg bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  value={announcementForm.bgColor || '#ff0055'}
                  onChange={(e) => setAnnouncementForm(prev => ({ ...prev, bgColor: e.target.value }))}
                  className="w-20 px-2 py-1 bg-slate-900 border border-slate-750 rounded text-xs font-mono text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <span className="text-xs font-bold text-slate-300">Color de Texto</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={announcementForm.textColor || '#ffffff'}
                  onChange={(e) => setAnnouncementForm(prev => ({ ...prev, textColor: e.target.value }))}
                  className="w-8 h-8 rounded-lg bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  value={announcementForm.textColor || '#ffffff'}
                  onChange={(e) => setAnnouncementForm(prev => ({ ...prev, textColor: e.target.value }))}
                  className="w-20 px-2 py-1 bg-slate-900 border border-slate-750 rounded text-xs font-mono text-white"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. GESTIÓN DE HERO BANNERS ROTATORIOS */}
      <div className="bg-[#0f1424]/40 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-850 pb-4">
          <div>
            <h3 className="font-extrabold text-white text-base">Campañas Publicitarias (Hero Banners)</h3>
            <p className="text-xs text-slate-400 mt-1">Administra los anuncios adaptativos rotatorios en la página de inicio del cliente.</p>
          </div>
          <Button
            onClick={openCreateBanner}
            variant="primary"
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 shadow-md font-bold flex items-center space-x-2 border-0"
          >
            <Plus className="h-4 w-4" />
            <span>Nueva Campaña</span>
          </Button>
        </div>

        {loadingBanners ? (
          <div className="py-12 text-center text-slate-400 text-xs">Cargando banners publicitarios...</div>
        ) : banners.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs space-y-3">
            <Image className="h-8 w-8 text-slate-650 mx-auto" />
            <p>No hay campañas publicitarias activas.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {banners.map((ban, idx) => {
              if (!ban) return null;
              return (
                <div key={ban?.id || `ban-${idx}`} className="bg-slate-950/20 border border-slate-850 rounded-2xl overflow-hidden hover:border-slate-700 transition-colors">
                  <div className="relative h-44 overflow-hidden bg-slate-950 flex items-center">
                    <img src={ban?.imageUrl} alt={ban?.title} className="absolute inset-0 w-full h-full object-cover opacity-20" />
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
                    <div className="relative z-10 p-6 space-y-2 max-w-lg text-left">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded">
                        {ban?.subtitle || 'CAMPAÑA WEB'}
                      </span>
                      <h4 className="text-xl font-extrabold text-white uppercase">{ban?.title}</h4>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{ban?.description}</p>
                    </div>
                  </div>

                  <div className="bg-slate-950/35 border-t border-slate-850 px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                    <div className="flex flex-wrap gap-4 text-slate-450">
                      <span>🔗 Enlace: <strong className="text-slate-350">{ban?.linkUrl}</strong></span>
                      <span>🏷️ Botón: <strong className="text-slate-350">{ban?.linkText}</strong></span>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditBanner(ban)}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-850 text-indigo-400 hover:text-white transition-colors cursor-pointer flex items-center space-x-1.5 font-bold"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={() => deleteBanner(ban?.id, ban?.title)}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-850 text-red-500 hover:text-white transition-colors cursor-pointer flex items-center space-x-1.5 font-bold"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
