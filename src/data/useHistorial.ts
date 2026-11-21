import { useMemo, useState } from 'react';
import { useAbrirMovimiento } from '../components/useAbrirMovimiento';
import type { Categoria, NuevaTransaccion, Transaccion } from '../types';
import { resumirMes } from '../utils/contabilidad';
import { fechaConHora, formatearMonto } from '../utils/fechas';
import {
  agruparPorMes,
  aplicarFiltros,
  contarFiltrosActivos,
  FILTROS_INICIALES,
  type FiltrosHistorial,
} from '../utils/filtrosHistorial';
import { useExportarExcel } from './useExportarExcel';
import { useFinanzas } from './FinanzasContext';

// Todo lo que necesita el Historial, en el celular y en escritorio: los
// movimientos filtrados y agrupados por mes, el estado de los filtros y de la
// edición, y las acciones de guardar y eliminar. Las dos pantallas solo cambian
// cómo lo dibujan.
export function useHistorial() {
  const { transacciones, categorias, cargando, actualizarMovimiento, eliminarMovimiento, crearCategoria } = useFinanzas();
  const [editando, setEditando] = useState<Transaccion | null>(null);
  const abrirMovimiento = useAbrirMovimiento(setEditando);
  const [filtros, setFiltros] = useState<FiltrosHistorial>(FILTROS_INICIALES);
  const [filtrosAbierto, setFiltrosAbierto] = useState(false);
  const excel = useExportarExcel();

  const categoriaPorId = useMemo(() => {
    const mapa = new Map<string, Categoria>(categorias.map((c) => [c.id, c]));
    return (id: string) => mapa.get(id);
  }, [categorias]);

  const transaccionesFiltradas = useMemo(
    () => aplicarFiltros(transacciones, categoriaPorId, filtros),
    [transacciones, categoriaPorId, filtros]
  );
  const grupos = useMemo(() => agruparPorMes(transaccionesFiltradas, filtros.orden), [transaccionesFiltradas, filtros.orden]);
  const resumenFiltrado = useMemo(() => resumirMes(transaccionesFiltradas, categoriaPorId), [transaccionesFiltradas, categoriaPorId]);

  function quitarCategoria(id: string) {
    setFiltros((prev) => {
      const copia = new Set(prev.categoriaIds);
      copia.delete(id);
      return { ...prev, categoriaIds: copia };
    });
  }

  async function manejarGuardar({ dia, ...datos }: NuevaTransaccion & { dia: string }) {
    if (!editando) return;
    await actualizarMovimiento(editando.id, datos, fechaConHora(dia, new Date(editando.fecha)));
    setEditando(null);
  }

  async function manejarEliminar() {
    if (!editando) return;
    await eliminarMovimiento(editando.id);
    setEditando(null);
  }

  const etiquetaMonto =
    filtros.montoMin !== null && filtros.montoMax !== null
      ? `${formatearMonto(filtros.montoMin)} – ${formatearMonto(filtros.montoMax)}`
      : filtros.montoMin !== null
        ? `Desde ${formatearMonto(filtros.montoMin)}`
        : filtros.montoMax !== null
          ? `Hasta ${formatearMonto(filtros.montoMax)}`
          : null;

  return {
    transacciones,
    categorias,
    cargando,
    categoriaPorId,
    crearCategoria,
    editando,
    setEditando,
    abrirMovimiento,
    filtros,
    setFiltros,
    filtrosAbierto,
    setFiltrosAbierto,
    filtrosActivos: contarFiltrosActivos(filtros),
    hayMovimientos: !cargando && transacciones.length > 0,
    transaccionesFiltradas,
    grupos,
    resumenFiltrado,
    neto: resumenFiltrado.disponible,
    quitarCategoria,
    etiquetaMonto,
    manejarGuardar,
    manejarEliminar,
    excel,
  };
}

export type DatosHistorial = ReturnType<typeof useHistorial>;
