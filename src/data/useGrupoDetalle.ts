import { useCallback, useEffect, useState } from 'react';
import * as dbGrupos from '../dbGrupos';
import type { DetalleGrupo, NuevoGastoGrupo } from '../types';

const DETALLE_VACIO: DetalleGrupo = { miembros: [], gastos: [], partes: [], pagos: [] };

export function useGrupoDetalle(grupoId: string | undefined) {
  const [detalle, setDetalle] = useState<DetalleGrupo>(DETALLE_VACIO);
  const [cargando, setCargando] = useState(true);

  const recargar = useCallback(async () => {
    if (!grupoId) return;
    setCargando(true);
    const datos = await dbGrupos.obtenerDetalleGrupo(grupoId);
    setDetalle(datos);
    setCargando(false);
  }, [grupoId]);

  useEffect(() => {
    if (grupoId) recargar();
  }, [grupoId, recargar]);

  async function agregarGasto(nuevo: NuevoGastoGrupo) {
    await dbGrupos.crearGastoGrupo(nuevo);
    await recargar();
  }

  async function eliminarGasto(id: string) {
    await dbGrupos.eliminarGastoGrupo(id);
    setDetalle((prev) => ({
      ...prev,
      gastos: prev.gastos.filter((g) => g.id !== id),
      partes: prev.partes.filter((p) => p.gastoId !== id),
    }));
  }

  async function registrarPago(deUserId: string, aUserId: string, monto: number) {
    if (!grupoId) return;
    const pago = await dbGrupos.registrarPago(grupoId, deUserId, aUserId, monto);
    setDetalle((prev) => ({ ...prev, pagos: [pago, ...prev.pagos] }));
  }

  return { ...detalle, cargando, agregarGasto, eliminarGasto, registrarPago };
}
