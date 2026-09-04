import defaultLogo from '../assets/img/kaviya_crackers_logo.jpeg';

/**
 * Returns a fully qualified or properly resolved image URL.
 * Handles Cloudflare R2 URLs, absolute HTTP/HTTPS/data URLs, and local relative paths.
 */
export const getImageUrl = (imagePath, fallback = defaultLogo) => {
  if (!imagePath) return fallback;
  if (
    typeof imagePath === 'string' &&
    (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('data:'))
  ) {
    return imagePath;
  }
  const cleanPath = String(imagePath).startsWith('/') ? imagePath : '/' + imagePath;
  const baseUrl = import.meta.env.VITE_API_URL || '';
  return `${baseUrl}${cleanPath}`;
};

