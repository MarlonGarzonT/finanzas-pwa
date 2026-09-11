export const NOMBRE_VISIBLE_STORAGE_KEY = 'finanzas-pwa:nombre-visible-grupo';

// Recuerda el último nombre que la persona usó en un grupo, para no tener que
// volver a escribirlo cada vez que crea uno nuevo o se une a otro.
export function sugerenciaNombreVisible(): string {
  try {
    return localStorage.getItem(NOMBRE_VISIBLE_STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}
