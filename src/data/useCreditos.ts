import { useMemo } from 'react';
import { estadosCreditos, resumirCreditos, type EstadoCredito, type ResumenCreditos } from '../utils/creditos';
import { useFinanzas } from './FinanzasContext';

export interface CreditosOrdenados {
  // Vencidos primero (el más atrasado arriba) y después por la fecha de la próxima cuota.
  activos: EstadoCredito[];
  saldados: EstadoCredito[];
  resumen: ResumenCreditos;
  porId: (id: string) => EstadoCredito | undefined;
}

export function useCreditos(): CreditosOrdenados {
  const { creditos, transacciones } = useFinanzas();

  return useMemo(() => {
    const estados = estadosCreditos(creditos, transacciones);
    const activos = estados
      .filter((e) => !e.saldado)
      .sort((a, b) => Number(b.vencida) - Number(a.vencida) || (a.proximaCuota?.fecha ?? '').localeCompare(b.proximaCuota?.fecha ?? ''));
    const saldados = estados.filter((e) => e.saldado);
    const mapa = new Map(estados.map((e) => [e.id, e]));
    return { activos, saldados, resumen: resumirCreditos(estados), porId: (id: string) => mapa.get(id) };
  }, [creditos, transacciones]);
}
