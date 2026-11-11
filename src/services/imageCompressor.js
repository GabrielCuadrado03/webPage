/**
 * imageCompressor.js
 * Comprime imágenes en el navegador usando Canvas HTML5 antes de subirlas a Firebase Storage.
 * Convierte cualquier foto (PNG, JPG, HEIC, etc.) a WebP o JPEG ligero.
 * 
 * Sin dependencias externas — usa únicamente APIs nativas del navegador.
 */

/**
 * Comprime una imagen antes de subirla al servidor.
 * 
 * @param {File} file - El archivo de imagen original seleccionado por el usuario.
 * @param {Object} options - Opciones de compresión.
 * @param {number} [options.maxWidthPx=1200] - Ancho máximo en píxeles (mantiene proporción).
 * @param {number} [options.quality=0.82] - Calidad de compresión (0.0 a 1.0). 0.82 = excelente relación peso/calidad.
 * @param {string} [options.outputFormat='image/webp'] - Formato de salida. Usar 'image/jpeg' como fallback.
 * @returns {Promise<File>} - El archivo comprimido y listo para subir.
 */
export async function compressImage(file, {
  maxWidthPx = 1200,
  quality = 0.82,
  outputFormat = 'image/webp',
} = {}) {
  return new Promise((resolve, reject) => {
    // Si el archivo ya es muy pequeño (< 150 KB), lo devolvemos sin comprimir
    if (file.size < 150 * 1024) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer el archivo de imagen.'));
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onerror = () => reject(new Error('No se pudo decodificar la imagen.'));
      img.onload = () => {
        // Calcular nuevas dimensiones manteniendo proporción original
        let { width, height } = img;
        if (width > maxWidthPx) {
          height = Math.round((height * maxWidthPx) / width);
          width = maxWidthPx;
        }

        // Dibujar en Canvas con las nuevas dimensiones
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Verificar si el navegador soporta WebP, si no caer a JPEG
        const supportsWebP = canvas.toDataURL('image/webp').startsWith('data:image/webp');
        const finalFormat = supportsWebP ? outputFormat : 'image/jpeg';
        const extension = finalFormat === 'image/webp' ? 'webp' : 'jpg';

        // Convertir canvas a Blob comprimido
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              // Si falló la compresión, devolver original sin cambios
              resolve(file);
              return;
            }
            // Crear nuevo File con nombre limpio y extensión correcta
            const originalNameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
            const compressedFile = new File(
              [blob],
              `${originalNameWithoutExt}.${extension}`,
              { type: finalFormat, lastModified: Date.now() }
            );
            resolve(compressedFile);
          },
          finalFormat,
          quality
        );
      };
      img.src = readerEvent.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Calcula un resumen legible del ahorro de compresión.
 * @param {number} originalBytes 
 * @param {number} compressedBytes 
 * @returns {string} Texto para mostrar al usuario
 */
export function getCompressionSummary(originalBytes, compressedBytes) {
  const originalKB = (originalBytes / 1024).toFixed(0);
  const compressedKB = (compressedBytes / 1024).toFixed(0);
  const saving = Math.round((1 - compressedBytes / originalBytes) * 100);
  return `${originalKB} KB → ${compressedKB} KB (${saving}% más ligera)`;
}
