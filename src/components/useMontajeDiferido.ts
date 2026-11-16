import { useEffect, useState } from 'react';

// Devuelve false en el primer cuadro y true un par de cuadros después. Sirve
// para que lo importante de una pantalla se pinte ya y lo pesado (gráficas,
// fondos con WebGL, tarjetas de más abajo) se monte justo después, sin
// bloquear la primera imagen. Quien lo use debe reservar el alto del espacio
// para que nada salte al aparecer.
export function useMontajeDiferido(): boolean {
  const [listo, setListo] = useState(false);
  useEffect(() => {
    let segundo = 0;
    const primero = requestAnimationFrame(() => {
      segundo = requestAnimationFrame(() => setListo(true));
    });
    return () => {
      cancelAnimationFrame(primero);
      cancelAnimationFrame(segundo);
    };
  }, []);
  return listo;
}
