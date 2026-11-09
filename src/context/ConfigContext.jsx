import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export const DEFAULT_CONFIG = {
  announcementBar: {
    enabled: true,
    text: '🔥 Envíos express a todo el país | Compras mayores a $50 con envío gratis',
    link: '/combos',
    linkText: 'Aprovechar Oferta',
    bgColor: '#ff0055',
    textColor: '#ffffff'
  }
};

const LOCAL_STORAGE_KEY = 'ethereal_vapes_site_config';

const ConfigContext = createContext(null);

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_CONFIG,
          ...parsed,
          announcementBar: { ...DEFAULT_CONFIG.announcementBar, ...(parsed.announcementBar || {}) }
        };
      }
    } catch (e) {
      console.warn('Error leyendo configuración de localStorage, usando defaults:', e);
    }
    return DEFAULT_CONFIG;
  });

  const [loading, setLoading] = useState(true);

  // Listener en tiempo real a Firebase Firestore (settings/general)
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
            announcementBar: { ...DEFAULT_CONFIG.announcementBar, ...(remoteData.announcementBar || {}) }
          };

          setConfig(mergedConfig);
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mergedConfig));
          } catch (e) {
            console.warn('No se pudo guardar la configuración en localStorage:', e);
          }
        }
        setLoading(false);
      },
      (error) => {
        console.warn('ConfigContext: Firestore en modo contingencia local (usando cache):', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Función para actualizar la configuración en Firestore
  const updateConfig = useCallback(async (newConfigPartial) => {
    try {
      const updated = {
        ...config,
        ...newConfigPartial,
        announcementBar: { ...config.announcementBar, ...(newConfigPartial.announcementBar || {}) }
      };

      setConfig(updated);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.warn('Error guardando en localStorage:', err);
      }

      const docRef = doc(db, 'settings', 'general');
      await setDoc(docRef, updated, { merge: true });
      return { success: true };
    } catch (error) {
      console.error('Error al actualizar configuración:', error);
      throw error;
    }
  }, [config]);

  return (
    <ConfigContext.Provider value={{ config, loading, updateConfig, DEFAULT_CONFIG }}>
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
