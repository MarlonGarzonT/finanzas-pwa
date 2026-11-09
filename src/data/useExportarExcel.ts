import { useState } from 'react';
import { exportarTransaccionesExcel } from '../utils/exportarExcel';
import { useFinanzas } from './FinanzasContext';

export interface ExportacionExcel {
  exportando: boolean;
  error: string | null;
  exportar: () => Promise<void>;
}

// Exporta todo el historial a un .xlsx (Historial y Perfil). ExcelJS se carga
// recién al exportar, en su propio chunk.
export function useExportarExcel(): ExportacionExcel {
  const { transacciones, categorias } = useFinanzas();
  const [exportando, setExportando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function exportar() {
    setExportando(true);
    setError(null);
    try {
      const porId = new Map(categorias.map((c) => [c.id, c]));
      await exportarTransaccionesExcel(transacciones, (id) => porId.get(id));
    } catch {
      setError('No se pudo generar el Excel. Revisa tu conexión e intenta de nuevo.');
    } finally {
      setExportando(false);
    }
  }

  return { exportando, error, exportar };
}
