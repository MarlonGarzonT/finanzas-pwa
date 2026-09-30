import type { Categoria, Transaccion } from '../types';
import { formatearFecha } from './fechas';

function escaparCampoCSV(valor: string): string {
  if (/[",\n]/.test(valor)) return `"${valor.replace(/"/g, '""')}"`;
  return valor;
}

export function exportarTransaccionesCSV(
  transacciones: Transaccion[],
  categoriaPorId: (id: string) => Categoria | undefined
): void {
  const encabezado = ['Fecha', 'Tipo', 'Categoría', 'Descripción', 'Monto', 'Semana del mes'];
  const filas = transacciones.map((t) => {
    const categoria = categoriaPorId(t.categoriaId);
    return [
      formatearFecha(t.fecha),
      t.tipo === 'ingreso' ? 'Ingreso' : 'Gasto',
      categoria?.nombre ?? 'Otros',
      t.item,
      String(t.monto),
      String(t.semanaDelMes),
    ]
      .map(escaparCampoCSV)
      .join(',');
  });
  const csv = [encabezado.join(','), ...filas].join('\r\n');

  // BOM al inicio para que Excel detecte UTF-8 y no dañe tildes/ñ al abrir el CSV.
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = `movimientos-${new Date().toISOString().slice(0, 10)}.csv`;
  enlace.click();
  URL.revokeObjectURL(url);
}
