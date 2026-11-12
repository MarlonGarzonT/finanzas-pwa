import { useSyncExternalStore } from 'react';

// Konsta marca el modo oscuro con la clase `dark` en <html> (utils/tema.ts),
// no con la media query. Los efectos que dibujan en canvas o WebGL necesitan
// saberlo para elegir colores; esto se actualiza si el tema cambia.
function suscribirTema(avisar: () => void) {
  const observador = new MutationObserver(avisar);
  observador.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => observador.disconnect();
}

export function useEsOscuro(): boolean {
  return useSyncExternalStore(suscribirTema, () => document.documentElement.classList.contains('dark'));
}
