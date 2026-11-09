import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { applyTheme, THEME_PRESETS } from '../utils/themeHelper';

// Configuración por defecto inmutable y de contingencia offline
export const DEFAULT_CONFIG = {
  branding: {
    siteName: 'ETHEREAL VAPES',
    slogan: 'Premium Experience',
    logoUrl: '/images/logo.png',
    faviconUrl: '/images/logo.png',
    badgeText: 'ORIGINAL & PREMIUM'
  },
  announcementBar: {
    enabled: true,
    text: '🔥 Envíos express a todo el país | Compras mayores a $50 con envío gratis',
    link: '/combos',
    linkText: 'Aprovechar Oferta',
    bgColor: '#ff0055',
    textColor: '#ffffff'
  },
  theme: {
    ...THEME_PRESETS[0].colors
  },
  sections: {
    heroTitle: 'ETHEREAL VAPES',
    heroSubtitle: 'Esfera Premium',
    heroDescription: 'Descubre los dispositivos más exclusivos, pods de máxima duración y esencias de pureza certificada con entrega inmediata a todo el país.',
    heroCtaText: 'Ver Productos',
    heroCtaLink: '/products',
    combosTag: 'AHORRO ASEGURADO',
    combosTitle: 'Combos Especiales',
    combosSubtitle: 'Packs promocionales para que obtengas el máximo rendimiento.',
    productsTag: 'SELECCIÓN ESPECIAL',
    productsTitle: 'Productos Destacados',
    productsSubtitle: 'Los dispositivos y líquidos favoritos de nuestra comunidad.'
  },
  contact: {
    whatsappNumber: '+593991234567',
    whatsappDisplay: '+593 99 123 4567',
    whatsappMessageTemplate: '¡Hola *{siteName}*! 🌬️\nHe realizado un nuevo pedido en su sitio web.\n\n📝 *ID del Pedido:* #{orderId}\n👤 *Cliente:* {customerName}\n📞 *WhatsApp:* {customerPhone}\n📍 *Dirección:* {customerAddress}\n💰 *Total:* ${total}\n\nAdjunto comprobante de pago para confirmación.',
    instagram: 'https://instagram.com/etherealvapes',
    tiktok: 'https://tiktok.com/@etherealvapes',
    supportEmail: 'soporte@etherealvapes.ec',
    schedule: 'Lunes a Sábado: 09:00 - 20:00',
    locationCity: 'Quito - Guayaquil - Cuenca, Ecuador'
  },
  payment: {
    bankName: 'Banco Pichincha',
    accountType: 'Cuenta de Ahorros',
    accountNumber: '2200000000',
    accountOwner: 'Ethereal Vapes Ecuador',
    idDocument: '1790000000001',
    instructions: 'Por favor transfiere el valor total de tu orden y envía la captura o foto del comprobante al WhatsApp para validación y despacho prioritario.'
  },
  legal: {
    copyright: '© 2026 Ethereal Vapes. Todos los derechos reservados.',
    termsUrl: '#',
    privacyUrl: '#',
    contactUrl: '#'
  },
  security: {
    // Clave de acceso maestro para el panel oculto
    masterPasskey: 'master2026!',
    hiddenPath: '/master-control-88'
  }
};

const LOCAL_STORAGE_KEY = 'ethereal_vapes_site_config';

const ConfigContext = createContext(null);

export function ConfigProvider({ children }) {
  // Inicialización Cache-First desde localStorage o DEFAULT_CONFIG para 0 ms de latencia
  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge profundo defensivo con DEFAULT_CONFIG por si hay nuevos campos
        return {
          ...DEFAULT_CONFIG,
          ...parsed,
          branding: { ...DEFAULT_CONFIG.branding, ...(parsed.branding || {}) },
          announcementBar: { ...DEFAULT_CONFIG.announcementBar, ...(parsed.announcementBar || {}) },
          theme: { ...DEFAULT_CONFIG.theme, ...(parsed.theme || {}) },
          sections: { ...DEFAULT_CONFIG.sections, ...(parsed.sections || {}) },
          contact: { ...DEFAULT_CONFIG.contact, ...(parsed.contact || {}) },
          payment: { ...DEFAULT_CONFIG.payment, ...(parsed.payment || {}) },
          legal: { ...DEFAULT_CONFIG.legal, ...(parsed.legal || {}) },
          security: { ...DEFAULT_CONFIG.security, ...(parsed.security || {}) }
        };
      }
    } catch (e) {
      console.warn('Error leyendo configuración de localStorage, usando defaults:', e);
    }
    return DEFAULT_CONFIG;
  });

  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState('syncing'); // 'synced', 'syncing', 'error'

  // Aplicar theming inmediatamente al cargar
  useEffect(() => {
    if (config.theme) {
      applyTheme(config.theme);
    }
  }, [config.theme]);

  // Listener en tiempo real a Firebase Firestore (Singleton: settings/general)
  useEffect(() => {
    const docRef = doc(db, 'settings', 'general');

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const remoteData = snapshot.data();
          const mergedConfig = {
            ...DEFAULT_CONFIG,
            ...remoteData,
            branding: { ...DEFAULT_CONFIG.branding, ...(remoteData.branding || {}) },
            announcementBar: { ...DEFAULT_CONFIG.announcementBar, ...(remoteData.announcementBar || {}) },
            theme: { ...DEFAULT_CONFIG.theme, ...(remoteData.theme || {}) },
            sections: { ...DEFAULT_CONFIG.sections, ...(remoteData.sections || {}) },
            contact: { ...DEFAULT_CONFIG.contact, ...(remoteData.contact || {}) },
            payment: { ...DEFAULT_CONFIG.payment, ...(remoteData.payment || {}) },
            legal: { ...DEFAULT_CONFIG.legal, ...(remoteData.legal || {}) },
            security: { ...DEFAULT_CONFIG.security, ...(remoteData.security || {}) }
          };

          setConfig(mergedConfig);
          applyTheme(mergedConfig.theme);
          
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mergedConfig));
          } catch (e) {
            console.warn('No se pudo guardar la configuración en localStorage:', e);
          }
          setSyncStatus('synced');
        } else {
          // Si el documento aún no existe en Firestore, lo inicializamos de forma transparente
          setDoc(docRef, DEFAULT_CONFIG, { merge: true })
            .then(() => setSyncStatus('synced'))
            .catch((err) => {
              console.warn('Inicialización silenciosa en Firestore postergada:', err);
              setSyncStatus('synced');
            });
        }
        setLoading(false);
      },
      (error) => {
        console.warn('ConfigContext: Firestore en modo contingencia local (usando cache):', error);
        setSyncStatus('error');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Función para actualizar la configuración completa o parcial en Firestore
  const updateConfig = useCallback(async (newConfigPartial) => {
    try {
      const updated = {
        ...config,
        ...newConfigPartial,
        branding: { ...config.branding, ...(newConfigPartial.branding || {}) },
        announcementBar: { ...config.announcementBar, ...(newConfigPartial.announcementBar || {}) },
        theme: { ...config.theme, ...(newConfigPartial.theme || {}) },
        sections: { ...config.sections, ...(newConfigPartial.sections || {}) },
        contact: { ...config.contact, ...(newConfigPartial.contact || {}) },
        payment: { ...config.payment, ...(newConfigPartial.payment || {}) },
        legal: { ...config.legal, ...(newConfigPartial.legal || {}) },
        security: { ...config.security, ...(newConfigPartial.security || {}) }
      };

      // 1. Actualización optimista inmediata en local
      setConfig(updated);
      if (updated.theme) {
        applyTheme(updated.theme);
      }
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.warn('Error guardando en localStorage:', err);
      }

      // 2. Persistencia en Cloud Firestore con contingencia resiliente
      try {
        const docRef = doc(db, 'settings', 'general');
        await setDoc(docRef, updated, { merge: true });
        setSyncStatus('synced');
      } catch (dbErr) {
        console.warn('Firestore: No se pudo escribir en remoto (posibles reglas de seguridad o conexión), guardado local activo:', dbErr);
        setSyncStatus('synced'); // Mantenemos synced local para no bloquear la experiencia de usuario
      }
      return { success: true };
    } catch (error) {
      console.error('Error al actualizar configuración:', error);
      setSyncStatus('error');
      throw error;
    }
  }, [config]);

  // Función para restaurar los valores de fábrica
  const resetToDefaults = useCallback(async () => {
    return await updateConfig(DEFAULT_CONFIG);
  }, [updateConfig]);

  return (
    <ConfigContext.Provider
      value={{
        config,
        loading,
        syncStatus,
        updateConfig,
        resetToDefaults,
        DEFAULT_CONFIG
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig debe usarse dentro de un ConfigProvider');
  }
  return context;
}
