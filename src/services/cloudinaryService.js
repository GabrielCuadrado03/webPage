/**
 * cloudinaryService.js
 * Servicio para subida directa de imágenes a Cloudinary (Unsigned Upload).
 * 100% gratuito, sin backend intermedio y sin requerir tarjeta de crédito.
 */

import { compressImage, getCompressionSummary } from './imageCompressor';

// Claves de entorno o valores por defecto oficiales de Cloudinary
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'xwbbvvz3';
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'WebVape';

/**
 * Sube una imagen a Cloudinary aplicando previamente compresión WebP en el navegador.
 * 
 * @param {File} file Archivo seleccionado en el navegador
 * @param {Object} customConfig Opcional: { cloudName, uploadPreset }
 * @returns {Promise<{ url: string, summary: string }>}
 */
export async function uploadToCloudinary(file, customConfig = {}) {
  const cloudName = customConfig.cloudName || CLOUD_NAME;
  const uploadPreset = customConfig.uploadPreset || UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error('Falta configurar Cloud Name o Upload Preset de Cloudinary.');
  }

  const originalSize = file.size;

  // 1. Comprimir en cliente antes de consumir ancho de banda
  const compressed = await compressImage(file, {
    maxWidthPx: 1200,
    quality: 0.82,
    outputFormat: 'image/webp'
  });

  const summary = getCompressionSummary(originalSize, compressed.size);

  // 2. Preparar FormData para la API pública de Cloudinary
  const formData = new FormData();
  formData.append('file', compressed);
  formData.append('upload_preset', uploadPreset);

  // 3. Petición POST a Cloudinary
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.error?.message || 'Error en la subida a Cloudinary';
    throw new Error(message);
  }

  const data = await response.json();
  
  // Retornamos la URL HTTPS segura y optimizada
  return {
    url: data.secure_url,
    publicId: data.public_id,
    summary
  };
}
