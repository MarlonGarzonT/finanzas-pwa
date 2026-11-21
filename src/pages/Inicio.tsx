import { lazy, Suspense } from 'react';
import { Cargando } from '../components/Cargando';
import { useEsEscritorio } from '../components/useEsEscritorio';
import { Resumen } from './Resumen';

// El tablero lleva las gráficas (Recharts): se descarga solo en computador.
const Tablero = lazy(() => import('./Tablero').then((m) => ({ default: m.Tablero })));

// La pantalla de entrada: en el celular, el Resumen de siempre; en un
// computador (desde 1024 px), el tablero completo.
export function Inicio() {
  const esEscritorio = useEsEscritorio();
  if (!esEscritorio) return <Resumen />;
  return (
    <Suspense fallback={<Cargando />}>
      <Tablero />
    </Suspense>
  );
}
