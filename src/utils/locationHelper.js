/**
 * Obtiene la dirección actual del dispositivo a través de GPS y geocodificación inversa con Nominatim.
 * @returns {Promise<string>} La dirección formateada en español.
 */
export const getCurrentLocationAddress = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('La geolocalización no está soportada por tu navegador.'));
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Consulta a Nominatim de OpenStreetMap con idioma forzado en español
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=es`
          );
          
          if (!response.ok) {
            throw new Error('Error al conectar con el servidor de mapas.');
          }

          const data = await response.json();
          if (data && data.display_name) {
            const addressParts = data.address || {};
            
            // Extraer las partes más representativas de una dirección latinoamericana
            const road = addressParts.road || addressParts.pedestrian || addressParts.suburb || '';
            const houseNumber = addressParts.house_number || '';
            const neighbourhood = addressParts.neighbourhood || addressParts.residential || addressParts.suburb || '';
            const city = addressParts.city || addressParts.town || addressParts.village || '';
            
            let cleanAddress = '';
            if (road) {
              cleanAddress += road;
            }
            if (houseNumber) {
              cleanAddress += ` #${houseNumber}`;
            }
            if (neighbourhood && neighbourhood !== road) {
              cleanAddress += `, ${neighbourhood}`;
            }
            if (city) {
              cleanAddress += `, ${city}`;
            }

            // Si por alguna razón la dirección limpia queda muy corta o vacía, usar el display_name completo
            resolve(cleanAddress.trim() || data.display_name);
          } else {
            resolve(`GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          }
        } catch (err) {
          console.warn("Error en Nominatim Geocoding, usando fallback de coordenadas:", err);
          resolve(`GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        }
      },
      (error) => {
        let msg = 'Ocurrió un error al obtener la ubicación.';
        if (error.code === 1) {
          msg = 'Permiso denegado. Por favor, habilita el acceso al GPS en la barra de tu navegador.';
        } else if (error.code === 2) {
          msg = 'La ubicación no está disponible. Activa el GPS de tu celular/dispositivo.';
        } else if (error.code === 3) {
          msg = 'Tiempo de espera agotado al obtener la ubicación GPS.';
        }
        reject(new Error(msg));
      },
      options
    );
  });
};

/**
 * Busca direcciones que coincidan con un texto ingresado.
 * @param {string} query Texto a buscar.
 * @returns {Promise<Array>} Lista de sugerencias formateadas.
 */
export const searchAddresses = async (query) => {
  if (!query || query.trim().length < 4) return [];
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&accept-language=es&addressdetails=1&countrycodes=ec&limit=5`
    );
    if (!response.ok) return [];
    
    const data = await response.json();
    return data.map((item) => {
      const addressParts = item.address || {};
      
      const road = addressParts.road || addressParts.pedestrian || addressParts.suburb || '';
      const houseNumber = addressParts.house_number || '';
      const neighbourhood = addressParts.neighbourhood || addressParts.residential || addressParts.suburb || '';
      const city = addressParts.city || addressParts.town || addressParts.village || '';
      
      let cleanAddress = '';
      if (road) {
        cleanAddress += road;
      }
      if (houseNumber) {
        cleanAddress += ` #${houseNumber}`;
      }
      if (neighbourhood && neighbourhood !== road) {
        cleanAddress += `, ${neighbourhood}`;
      }
      if (city) {
        cleanAddress += `, ${city}`;
      }

      return {
        id: item.place_id || Math.random().toString(),
        displayName: cleanAddress.trim() || item.display_name,
        fullName: item.display_name
      };
    });
  } catch (err) {
    console.warn("Error buscando sugerencias de dirección:", err);
    return [];
  }
};
