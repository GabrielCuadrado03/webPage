import React from 'react';
import { getPlaceholderImage } from '../../../utils/placeholders';

/**
 * Collage visual de hasta 4 imágenes de productos para tarjetas de Combos en el ERP.
 */
export default function ComboImageCollage({ productIds, products, defaultImageUrl, className = "" }) {
  const images = (productIds || [])
    .map(pid => {
      const p = products.find(prod => prod.id === pid);
      return p?.imageUrl || null;
    })
    .filter(Boolean);

  const uniqueImages = [...new Set(images)];

  if (uniqueImages.length === 0) {
    return (
      <div className={`w-full h-full relative overflow-hidden bg-slate-950 ${className}`}>
        <img
          src={defaultImageUrl || getPlaceholderImage('Combo')}
          alt="Combo default"
          className="w-full h-full object-cover opacity-75"
        />
      </div>
    );
  }

  if (uniqueImages.length === 1) {
    return (
      <div className={`w-full h-full relative overflow-hidden bg-slate-950 ${className}`}>
        <img
          src={uniqueImages[0]}
          alt="Combo single product"
          className="w-full h-full object-cover opacity-75"
        />
      </div>
    );
  }

  if (uniqueImages.length === 2) {
    return (
      <div className={`w-full h-full grid grid-cols-2 gap-[1px] bg-slate-800 relative ${className}`}>
        {uniqueImages.slice(0, 2).map((img, idx) => (
          <img
            key={idx}
            src={img}
            alt={`Combo product ${idx + 1}`}
            className="w-full h-full object-cover opacity-75"
          />
        ))}
      </div>
    );
  }

  if (uniqueImages.length === 3) {
    return (
      <div className={`w-full h-full grid grid-cols-3 gap-[1px] bg-slate-800 relative ${className}`}>
        <div className="col-span-2 h-full w-full">
          <img
            src={uniqueImages[0]}
            alt="Combo product 1"
            className="w-full h-full object-cover opacity-75"
          />
        </div>
        <div className="grid grid-rows-2 gap-[1px] h-full w-full">
          <img
            src={uniqueImages[1]}
            alt="Combo product 2"
            className="w-full h-full object-cover opacity-75"
          />
          <img
            src={uniqueImages[2]}
            alt="Combo product 3"
            className="w-full h-full object-cover opacity-75"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full h-full grid grid-cols-2 grid-rows-2 gap-[1px] bg-slate-800 relative ${className}`}>
      {uniqueImages.slice(0, 4).map((img, idx) => (
        <img
          key={idx}
          src={img}
          alt={`Combo product ${idx + 1}`}
          className="w-full h-full object-cover opacity-75"
        />
      ))}
    </div>
  );
}
