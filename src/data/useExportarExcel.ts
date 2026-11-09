import { useEffect, useState } from 'react';
import { exportarTransaccionesExcel } from '../utils/exportarExcel';
import { useFinanzas } from './FinanzasContext';

// Cuánto se queda la confirmación "Listo" antes de volver al estado normal.
const DURACION_LISTO_MS = 3000;

export interface ExportacionExcel {
  exportando: boolean;
  listo: boolean;
  error: string | null;
  exportar: () => Promise<void>;
}

// Exporta todo el historial a un .xlsx (Historial y Perfil). ExcelJS se carga
// recién al exportar, en su propio chunk.
export function useExportarExcel(): ExportacionExcel {
  const { transacciones, categorias } = useFinanzas();
  const [exportando, setExportando] = useState(false);
  const [listo, setListo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!listo) return;
    const id = window.setTimeout(() => setListo(false), DURACION_LISTO_MS);
    return () => window.clearTimeout(id);
  }, [listo]);

  async function exportar() {
    setExportando(true);
    setListo(false);
    setError(null);
    try {
      const porId = new Map(categorias.map((c) => [c.id, c]));
      await exportarTransaccionesExcel(transacciones, (id) => porId.get(id));
      setListo(true);
    } catch {
      setError('No se pudo generar el Excel. Revisa tu conexión e intenta de nuevo.');
    } finally {
      setExportando(false);
    }
  }

  return { exportando, listo, error, exportar };
}
