/**
 * Utilidades de Theming Dinámico en Tiempo Real para Ethereal Vapes
 * Inyecta Variables CSS y Reglas Globales Dinámicas en document.head
 */

// Presets de Paletas de Colores de Nivel Empresarial
export const THEME_PRESETS = [
  {
    id: 'original-factory',
    name: '🌟 Configuración Original de Fábrica',
    description: 'El diseño y colores originales exactos de la tienda: Negro Mate profundo, Azul Cian Neón (#00d2ff), Rojo Cereza (#f43f5e) y degradado nocturno superior (#0f1326).',
    colors: {
      primary: '#00d2ff',
      primaryHover: '#0284c7',
      secondary: '#f43f5e',
      secondaryHover: '#be123c',
      accent: '#8b5cf6',
      bgBase: '#050507',
      bgSurface: '#0f1326',
      bgCard: 'rgba(18, 20, 26, 0.65)',
      textMain: '#f8fafc',
      textMuted: '#94a3b8',
      borderColor: 'rgba(255, 255, 255, 0.08)'
    }
  },
  {
    id: 'obsidian-gold',
    name: 'Obsidiana & Oro Prestige',
    description: 'Dorado refinado sobre negro ónix para una estética de ultra lujo.',
    colors: {
      primary: '#f59e0b',
      primaryHover: '#d97706',
      secondary: '#eab308',
      secondaryHover: '#ca8a04',
      accent: '#f97316',
      bgBase: '#09090b',
      bgSurface: '#121217',
      bgCard: 'rgba(24, 24, 27, 0.75)',
      textMain: '#fef3c7',
      textMuted: '#a1a1aa',
      borderColor: 'rgba(245, 158, 11, 0.15)'
    }
  },
  {
    id: 'emerald-matrix',
    name: 'Emerald Matrix',
    description: 'Verde esmeralda bio-luminescente con toques de cian sobre carbón.',
    colors: {
      primary: '#10b981',
      primaryHover: '#059669',
      secondary: '#06b6d4',
      secondaryHover: '#0891b2',
      accent: '#14b8a6',
      bgBase: '#040d0a',
      bgSurface: '#081712',
      bgCard: 'rgba(6, 30, 22, 0.70)',
      textMain: '#ecfdf5',
      textMuted: '#9ca3af',
      borderColor: 'rgba(16, 185, 129, 0.15)'
    }
  },
  {
    id: 'midnight-purple',
    name: 'Midnight Vapour',
    description: 'Púrpura cósmico, fucsia brillante y destellos índigo.',
    colors: {
      primary: '#a855f7',
      primaryHover: '#9333ea',
      secondary: '#ec4899',
      secondaryHover: '#db2777',
      accent: '#6366f1',
      bgBase: '#07060f',
      bgSurface: '#100e1f',
      bgCard: 'rgba(26, 21, 48, 0.70)',
      textMain: '#fdf4ff',
      textMuted: '#94a3b8',
      borderColor: 'rgba(168, 85, 247, 0.15)'
    }
  },
  {
    id: 'crimson-smoke',
    name: 'Crimson Smoke',
    description: 'Rojo carmesí volcánico de alto contraste y sombras oscuras.',
    colors: {
      primary: '#ef4444',
      primaryHover: '#dc2626',
      secondary: '#f97316',
      secondaryHover: '#ea580c',
      accent: '#e11d48',
      bgBase: '#090505',
      bgSurface: '#140a0a',
      bgCard: 'rgba(28, 15, 15, 0.70)',
      textMain: '#fef2f2',
      textMuted: '#9ca3af',
      borderColor: 'rgba(239, 68, 68, 0.15)'
    }
  }
];

// Mapeo entre las propiedades de tema y las variables CSS en document.documentElement
const CSS_VARIABLE_MAP = {
  primary: '--color-primary',
  primaryHover: '--color-primary-hover',
  secondary: '--color-secondary',
  secondaryHover: '--color-secondary-hover',
  accent: '--color-accent',
  bgBase: '--color-bg-base',
  bgSurface: '--color-bg-surface',
  bgCard: '--color-bg-card',
  textMain: '--color-text-main',
  textMuted: '--color-text-muted',
  borderColor: '--color-border'
};

const DYNAMIC_STYLE_TAG_ID = 'ethereal-dynamic-theme-overrides';

/**
 * Aplica en tiempo real un conjunto de colores en el DOM
 * Utiliza tanto CSS Variables como una etiqueta <style> inyectada para sobrescribir
 * de forma precisa y sin afectar contenedores no deseados
 * @param {Object} theme Objeto con las propiedades de color
 */
export function applyTheme(theme) {
  if (!theme || typeof window === 'undefined') return;
  const root = document.documentElement;

  // 1. Inyectar variables en :root
  Object.entries(theme).forEach(([key, value]) => {
    const cssVar = CSS_VARIABLE_MAP[key];
    if (cssVar && value) {
      root.style.setProperty(cssVar, value);
    }
  });

  const p = theme.primary || '#00d2ff';
  const pHover = theme.primaryHover || p;
  const s = theme.secondary || '#f43f5e';
  const sHover = theme.secondaryHover || s;
  const bgBase = theme.bgBase || '#050507';
  const bgSurface = theme.bgSurface || '#0f1326';
  const textMain = theme.textMain || '#f8fafc';
  const textMuted = theme.textMuted || '#94a3b8';

  // 2. Inyectar / Actualizar reglas CSS dinámicas con precisión milimétrica
  const cssRules = `
    :root {
      --color-primary: ${p} !important;
      --color-primary-hover: ${pHover} !important;
      --color-secondary: ${s} !important;
      --color-secondary-hover: ${sHover} !important;
      --color-bg-base: ${bgBase} !important;
      --color-bg-surface: ${bgSurface} !important;
      --color-text-main: ${textMain} !important;
      --color-text-muted: ${textMuted} !important;
    }

    /* Fondo dinámico del sitio web */
    body, html, #root {
      background: radial-gradient(circle at top, ${bgSurface} 0%, ${bgBase} 60%, #020203 100%) !important;
      color: ${textMain} !important;
    }

    /* Mapeo preciso de clases de Color Primario */
    .text-\\[\\#00d2ff\\],
    .text-purple-400,
    [class~="text-[#00d2ff]"],
    [class~="text-purple-400"] {
      color: ${p} !important;
    }

    .hover\\:text-\\[\\#00d2ff\\]:hover,
    .group-hover\\:text-\\[\\#00d2ff\\] {
      color: ${p} !important;
    }

    .bg-\\[\\#00d2ff\\],
    .bg-purple-600,
    [class~="bg-[#00d2ff]"],
    [class~="bg-purple-600"] {
      background-color: ${p} !important;
    }

    .border-\\[\\#00d2ff\\],
    .border-purple-400,
    .border-purple-500,
    [class~="border-[#00d2ff]"],
    [class~="border-purple-400"] {
      border-color: ${p} !important;
    }

    /* Mapeo preciso de clases de Color Secundario */
    .text-\\[\\#ff0055\\],
    .text-\\[\\#f43f5e\\],
    [class~="text-[#ff0055]"],
    [class~="text-[#f43f5e]"] {
      color: ${s} !important;
    }

    .bg-\\[\\#ff0055\\],
    .bg-\\[\\#f43f5e\\],
    [class~="bg-[#ff0055]"],
    [class~="bg-[#f43f5e]"] {
      background-color: ${s} !important;
    }

    .border-\\[\\#ff0055\\],
    .border-\\[\\#f43f5e\\],
    [class~="border-[#ff0055]"],
    [class~="border-[#f43f5e]"] {
      border-color: ${s} !important;
    }

    /* Efectos de resplandor Neón en texto */
    .glow-text-cyan {
      text-shadow: 0 0 15px ${p} !important;
    }

    .glow-text-cherry {
      text-shadow: 0 0 15px ${s} !important;
    }

    /* Hover en tarjetas de catálogo */
    .glass-card:hover {
      border-color: ${p} !important;
      box-shadow: 0 0 25px -5px ${p}33, 0 20px 40px -15px rgba(0, 0, 0, 0.8) !important;
    }

    /* Inputs activos */
    input:focus, textarea:focus {
      border-color: ${p} !important;
      box-shadow: 0 0 15px ${p}33 !important;
    }
  `;

  let styleTag = document.getElementById(DYNAMIC_STYLE_TAG_ID);
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = DYNAMIC_STYLE_TAG_ID;
    document.head.appendChild(styleTag);
  }
  styleTag.textContent = cssRules;
}
