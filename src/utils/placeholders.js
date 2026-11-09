/**
 * Generates a clean, vector-based SVG placeholder image as a data URI.
 * Avoids calling random external image APIs (like picsum.photos).
 */
export const getPlaceholderImage = (text = "Ethereal Vapes") => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f172a" />
        <stop offset="50%" stop-color="#161b2c" />
        <stop offset="100%" stop-color="#020617" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)" />
    <text x="50%" y="52%" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="14" fill="#475569" letter-spacing="4" text-anchor="middle" dominant-baseline="middle">
      ${text.toUpperCase()}
    </text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};
