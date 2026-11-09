import { useMemo } from 'react';
import type { GastoAnual, NuevoGastoAnual } from '../types';
import { costoMensualEquivalente, cuotaParaLlegar, mesesRestantes, pagadoEsteAnio } from '../utils/provisiones';
import { useFinanzas } from './FinanzasContext';

export interface GastoAnualConEstado extends GastoAnual {
  // Lo que hay que separar cada mes para llegar al próximo vencimiento.
  cuotaMensual: number;
  vencePronto: boolean;
  // Vence este mes y ya hay un egreso de su categoría registrado.
  pagadoEsteMes: boolean;
}

export interface GastosAnuales {
  gastos: GastoAnualConEstado[];
  costoMensual: number;
  crear: (nuevo: NuevoGastoAnual) => Promise<void>;
  actualizar: (id: string, cambios: Partial<NuevoGastoAnual>) => Promise<void>;
  eliminar: (id: string) => Promise<void>;
}

export function useGastosAnuales(): GastosAnuales {
  const { gastosAnuales, transacciones, crearGastoAnual, actualizarGastoAnual, eliminarGastoAnual } = useFinanzas();

  const gastos = useMemo(() => {
    const hoy = new Date();
    const mesActual = hoy.getMonth() + 1;
    return gastosAnuales.map((g) => ({
      ...g,
      cuotaMensual: cuotaParaLlegar(g, hoy),
      vencePronto: mesesRestantes(g.mesVencimiento, hoy) === 1,
      pagadoEsteMes: g.mesVencimiento === mesActual && pagadoEsteAnio(g, transacciones, hoy),
    }));
  }, [gastosAnuales, transacciones]);

  const costoMensual = useMemo(() => costoMensualEquivalente(gastosAnuales), [gastosAnuales]);

  return {
    gastos,
    costoMensual,
    crear: crearGastoAnual,
    actualizar: actualizarGastoAnual,
    eliminar: eliminarGastoAnual,
  };
}
