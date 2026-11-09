import React from 'react';

export default function GlowingBackground() {
  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none z-[-1] overflow-hidden bg-slate-950">
      {/* Luces y degradados radiales dinámicos */}
      <div className="absolute top-[20%] left-[-10%] w-[50vw] h-[50vw] bg-[#00d2ff]/3 rounded-full blur-[120px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[50vw] h-[50vw] bg-[#ff0055]/3 rounded-full blur-[120px] animate-pulse pointer-events-none" style={{ animationDuration: '8s' }} />

      {/* SVG de Topografía y Circuitos Fluorescentes */}
      <svg className="w-full h-full opacity-35" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
        <defs>
          {/* Filtro de brillo neón para los colores */}
          <filter id="neon-glow-cyan" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          <filter id="neon-glow-red" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Líneas oscuras de topografía de fondo */}
        <g stroke="#1e293b" strokeWidth="0.5" fill="none" opacity="0.4">
          <path d="M-100,150 C300,50 600,300 900,100 C1200,-100 1500,200 2100,50" />
          <path d="M-100,200 C300,100 600,350 900,150 C1200,-50 1500,250 2100,100" />
          <path d="M-100,250 C300,150 600,400 900,200 C1200,0 1500,300 2100,150" />
          
          <path d="M-100,450 C350,600 550,250 1000,500 C1400,700 1600,350 2100,600" />
          <path d="M-100,500 C350,650 550,300 1000,550 C1400,750 1600,400 2100,650" />
          <path d="M-100,550 C350,700 550,350 1000,600 C1400,800 1600,450 2100,700" />

          <path d="M-100,800 C400,1000 700,600 1100,900 C1500,1100 1700,750 2100,1000" />
          <path d="M-100,850 C400,1050 700,650 1100,950 C1500,1150 1700,800 2100,1050" />
        </g>

        {/* Líneas fluorescentes cian (Circuitos) */}
        <g stroke="#00d2ff" fill="none" opacity="0.3" filter="url(#neon-glow-cyan)">
          {/* Línea Principal 1 */}
          <path 
            d="M-50,180 C310,80 590,320 890,130 C1190,-70 1490,220 2050,80" 
            strokeWidth="1.2"
            strokeDasharray="8 8"
            className="animate-pulse"
          />
          {/* Línea delgada satélite */}
          <path 
            d="M-50,185 C310,85 590,325 890,135 C1190,-65 1490,225 2050,85" 
            strokeWidth="0.4"
          />
        </g>

        {/* Líneas fluorescentes rojo cereza (Circuitos) */}
        <g stroke="#ff0055" fill="none" opacity="0.35" filter="url(#neon-glow-red)">
          {/* Línea Principal 2 */}
          <path 
            d="M-50,520 C410,670 610,320 1060,570 C1460,770 1660,420 2050,670" 
            strokeWidth="1.2"
            strokeDasharray="12 6"
          />
          <path 
            d="M-50,525 C410,675 610,325 1060,575 C1460,775 1660,425 2050,675" 
            strokeWidth="0.4"
          />
        </g>

        {/* Nodos glowing circulantes en las intersecciones */}
        <g opacity="0.6">
          {/* Cian Nodes */}
          <circle cx="450" cy="210" r="4" fill="#00d2ff" filter="url(#neon-glow-cyan)" className="animate-ping" style={{ animationDuration: '3s' }} />
          <circle cx="450" cy="210" r="2.5" fill="#00d2ff" />
          
          <circle cx="1320" cy="90" r="3" fill="#00d2ff" filter="url(#neon-glow-cyan)" />
          
          {/* Red Nodes */}
          <circle cx="850" cy="510" r="4" fill="#ff0055" filter="url(#neon-glow-red)" className="animate-ping" style={{ animationDuration: '4s' }} />
          <circle cx="850" cy="510" r="2.5" fill="#ff0055" />

          <circle cx="1600" cy="540" r="3" fill="#ff0055" filter="url(#neon-glow-red)" />
          <circle cx="210" cy="550" r="2" fill="#ff0055" />
        </g>
      </svg>
    </div>
  );
}
