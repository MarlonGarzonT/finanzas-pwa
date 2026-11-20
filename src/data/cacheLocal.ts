import type { Categoria, Credito, GastoAnual, Prestamo, Transaccion } from '../types';

// Copia local de los datos del usuario para abrir la app al instante: se
// muestra lo último que se vio y, en segundo plano, se pide lo nuevo a
// Supabase (stale-while-revalidate). Vive en localStorage, por usuario y con
// versión: si cambia la forma de los datos se sube VERSION y la copia vieja
// se ignora. Los tipos de fecha son texto ISO, así que sobreviven al JSON.
const VERSION = 1;
const PREFIJO = 'mi-cuadre:datos:';

export interface InstantaneaDatos {
  categorias: Categoria[];
  transacciones: Transaccion[];
  gastosAnuales: GastoAnual[];
  prestamos: Prestamo[];
  creditos: Credito[];
}

// Una copia de hace menos de esto se considera al día y no se vuelve a pedir.
export const FRESCURA_MS = 2 * 60 * 1000;

function clave(userId: string): string {
  return `${PREFIJO}v${VERSION}:${userId}`;
}

function claveHora(userId: string): string {
  return `${clave(userId)}:hora`;
}

// Milisegundos desde la última vez que se confirmó la copia con el servidor.
export function edadCache(userId: string): number {
  try {
    const hora = Number(localStorage.getItem(claveHora(userId)));
    return hora ? Date.now() - hora : Infinity;
  } catch {
    return Infinity;
  }
}

export function marcarCacheAlDia(userId: string): void {
  try {
    localStorage.setItem(claveHora(userId), String(Date.now()));
  } catch {
    // Sin almacenamiento: se pedirá de nuevo la próxima vez.
  }
}

// Devuelve el texto guardado tal cual: sirve para comparar con lo que llega
// del servidor sin volver a serializar dos veces.
export function leerTextoCache(userId: string): string | null {
  try {
    return localStorage.getItem(clave(userId));
  } catch {
    return null;
  }
}

export function leerCache(userId: string): InstantaneaDatos | null {
  const texto = leerTextoCache(userId);
  if (!texto) return null;
  try {
    const datos = JSON.parse(texto) as Partial<InstantaneaDatos>;
    if (!Array.isArray(datos.categorias) || !Array.isArray(datos.transacciones)) return null;
    return {
      categorias: datos.categorias,
      transacciones: datos.transacciones,
      gastosAnuales: Array.isArray(datos.gastosAnuales) ? datos.gastosAnuales : [],
      prestamos: Array.isArray(datos.prestamos) ? datos.prestamos : [],
      creditos: Array.isArray(datos.creditos) ? datos.creditos : [],
    };
  } catch {
    return null;
  }
}

export function serializar(datos: InstantaneaDatos): string {
  return JSON.stringify(datos);
}

// Si el almacenamiento está lleno o bloqueado (modo privado) simplemente no
// hay copia: la app sigue funcionando pidiendo todo cada vez.
export function guardarTextoCache(userId: string, texto: string): void {
  try {
    localStorage.setItem(clave(userId), texto);
    localStorage.setItem(claveHora(userId), String(Date.now()));
  } catch {
    // Sin espacio o sin acceso: se sigue sin copia local.
  }
}

// Al cerrar sesión no queda ningún dato financiero en el teléfono.
export function borrarCache(): void {
  try {
    for (const nombre of Object.keys(localStorage)) {
      if (nombre.startsWith(PREFIJO)) localStorage.removeItem(nombre);
    }
  } catch {
    // Sin acceso al almacenamiento: nada que borrar.
  }
}
