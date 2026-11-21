import { useSyncExternalStore } from 'react';

// Desde aquí la app usa la composición de escritorio (el tablero). Es el
// `lg` de Tailwind, el mismo punto donde la portada del login pasa a dos columnas.
const CONSULTA = '(min-width: 1024px)';

function suscribir(avisar: () => void): () => void {
  const lista = window.matchMedia(CONSULTA);
  lista.addEventListener('change', avisar);
  return () => lista.removeEventListener('change', avisar);
}

function instantanea(): boolean {
  return window.matchMedia(CONSULTA).matches;
}

// true en pantallas de computador (≥ 1024 px), y cambia solo si se redimensiona la ventana.
export function useEsEscritorio(): boolean {
  return useSyncExternalStore(suscribir, instantanea, () => false);
}
