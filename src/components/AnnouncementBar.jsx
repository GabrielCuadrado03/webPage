import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useConfig } from '../context/ConfigContext';
import { ArrowRight, X, Sparkles } from 'lucide-react';

export default function AnnouncementBar() {
  const { config } = useConfig();
  const [isDismissed, setIsDismissed] = useState(false);

  const announcement = config?.announcementBar;

  if (!announcement || !announcement.enabled || isDismissed) {
    return null;
  }

  const bgColor = announcement.bgColor || 'var(--color-secondary)';
  const textColor = announcement.textColor || '#ffffff';

  return (
    <aside 
      aria-label="Anuncio promocional"
      style={{ backgroundColor: bgColor, color: textColor }}
      className="relative z-50 text-xs py-2 px-4 font-semibold tracking-wide shadow-md transition-all duration-300"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        
        {/* Espaciador izquierdo para centrar el contenido */}
        <div className="hidden sm:block w-6" />

        {/* Mensaje central y enlace */}
        <div className="flex-1 flex flex-wrap items-center justify-center gap-2 text-center">
          <Sparkles className="h-3.5 w-3.5 animate-pulse shrink-0 hidden sm:inline-block" />
          <span className="font-medium drop-shadow-sm">
            {announcement.text}
          </span>
          {announcement.link && announcement.linkText && (
            <Link
              to={announcement.link}
              className="inline-flex items-center gap-1 font-bold underline underline-offset-2 hover:opacity-90 ml-1 group shrink-0"
            >
              <span>{announcement.linkText}</span>
              <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
        </div>

        {/* Botón para cerrar temporalmente durante la sesión */}
        <button
          onClick={() => setIsDismissed(true)}
          className="p-1 rounded-md hover:bg-black/15 transition-colors cursor-pointer shrink-0"
          title="Ocultar aviso"
          aria-label="Cerrar aviso"
        >
          <X className="h-3.5 w-3.5" />
        </button>

      </div>
    </aside>
  );
}
