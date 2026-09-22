import { useEffect, useRef, useState } from 'react';

// Anima un número desde 0 hasta `valor` en `duracionMs` (ease-out), para que
// las cifras grandes de los gráficos "cuenten" en vez de aparecer de golpe.
export function useContarHasta(valor: number, duracionMs = 900): number {
  const [actual, setActual] = useState(0);
  const frameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const inicio = performance.now();
    const desde = 0;

    function paso(ahora: number) {
      const transcurrido = Math.min(1, (ahora - inicio) / duracionMs);
      const facilitado = 1 - Math.pow(1 - transcurrido, 3); // ease-out cubic
      setActual(desde + (valor - desde) * facilitado);
      if (transcurrido < 1) frameRef.current = requestAnimationFrame(paso);
    }

    frameRef.current = requestAnimationFrame(paso);
    return () => {
      if (frameRef.current !== undefined) cancelAnimationFrame(frameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- se re-arma solo cuando cambia el valor final
  }, [valor, duracionMs]);

  return actual;
}
