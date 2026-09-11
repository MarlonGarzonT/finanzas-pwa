import { useEffect, useState } from 'react';
import type { MiembroGrupo, NuevoGastoGrupo } from '../types';
import { formatearMonto } from '../utils/fechas';
import { AvatarMiembro } from './AvatarMiembro';
import './GrupoSheets.css';
import { useBloqueoDeFondo, useGestosSheet } from './useComportamientoSheet';

interface Props {
  abierto: boolean;
  grupoId: string;
  miembros: MiembroGrupo[];
  miId: string;
  onCerrar: () => void;
  onAgregar: (nuevo: NuevoGastoGrupo) => Promise<void>;
}

// Reparte un monto entero entre N personas sin perder ni un peso por
// redondeo: las primeras `resto` personas reciben un peso extra.
function repartirIgual(monto: number, cantidad: number): number[] {
  if (cantidad === 0) return [];
  const base = Math.floor(monto / cantidad);
  const resto = monto - base * cantidad;
  return Array.from({ length: cantidad }, (_, i) => base + (i < resto ? 1 : 0));
}

export function NuevoGastoGrupoSheet({ abierto, grupoId, miembros, miId, onCerrar, onAgregar }: Props) {
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');
  const [pagadoPor, setPagadoPor] = useState(miId);
  const [incluidos, setIncluidos] = useState<Set<string>>(() => new Set(miembros.map((m) => m.userId)));
  const [modoPersonalizado, setModoPersonalizado] = useState(false);
  const [montosPersonalizados, setMontosPersonalizados] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useBloqueoDeFondo(abierto);
  const gestos = useGestosSheet(abierto, onCerrar);

  useEffect(() => {
    if (!abierto) return;
    setDescripcion('');
    setMonto('');
    setPagadoPor(miId);
    setIncluidos(new Set(miembros.map((m) => m.userId)));
    setModoPersonalizado(false);
    setMontosPersonalizados({});
    setError(null);
  }, [abierto, miId, miembros]);

  if (!abierto) return null;

  const montoNum = Number(monto) || 0;

  function alternarIncluido(userId: string) {
    setIncluidos((prev) => {
      const copia = new Set(prev);
      if (copia.has(userId)) copia.delete(userId);
      else copia.add(userId);
      return copia;
    });
  }

  const sumaPersonalizada = Object.values(montosPersonalizados).reduce((acc, v) => acc + (Number(v) || 0), 0);
  const restante = montoNum - sumaPersonalizada;

  function calcularPartes(): { userId: string; monto: number }[] {
    if (modoPersonalizado) {
      return miembros
        .map((m) => ({ userId: m.userId, monto: Number(montosPersonalizados[m.userId]) || 0 }))
        .filter((p) => p.monto > 0);
    }
    const idsIncluidos = miembros.filter((m) => incluidos.has(m.userId)).map((m) => m.userId);
    const montos = repartirIgual(montoNum, idsIncluidos.length);
    return idsIncluidos.map((userId, i) => ({ userId, monto: montos[i] }));
  }

  const partesValidas = modoPersonalizado ? restante === 0 && sumaPersonalizada > 0 : incluidos.size > 0;
  const puedeGuardar = descripcion.trim() !== '' && montoNum > 0 && pagadoPor !== '' && partesValidas;

  async function manejarGuardar() {
    if (!puedeGuardar) return;
    setGuardando(true);
    setError(null);
    try {
      await onAgregar({
        grupoId,
        descripcion: descripcion.trim(),
        monto: montoNum,
        pagadoPor,
        partes: calcularPartes(),
      });
      onCerrar();
    } catch {
      setError('No se pudo guardar el gasto. Intenta de nuevo.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="sheet-overlay" onClick={onCerrar} style={gestos.overlayStyle}>
      <div
        className={`sheet ${gestos.arrastrando ? 'sheet--arrastrando' : ''}`}
        onClick={(e) => e.stopPropagation()}
        onFocusCapture={gestos.onFocusCaptureSheet}
        style={gestos.sheetStyle}
      >
        <div className="sheet__header">
          <div
            className="sheet__handle-area"
            onPointerDown={gestos.onPointerDownHandle}
            onPointerMove={gestos.onPointerMoveHandle}
            onPointerUp={gestos.onPointerUpHandle}
            onPointerCancel={gestos.onPointerUpHandle}
          >
            <div className="sheet__handle" />
          </div>
          <h2 className="sheet__titulo">Nuevo gasto</h2>

          <div className="monto-input">
            <span>$</span>
            <input
              inputMode="numeric"
              placeholder="0"
              value={monto ? Number(monto).toLocaleString('es-CO') : ''}
              onChange={(e) => setMonto(e.target.value.replace(/\D/g, ''))}
              autoFocus
            />
          </div>
        </div>

        <input
          className="texto-input"
          placeholder="¿Qué fue? (ej. Comida, Hospedaje, Gasolina)"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />

        <div>
          <p className="grupo-sheets__ayuda">¿Quién pagó?</p>
          <div className="grupo-sheets__chips">
            {miembros.map((m) => (
              <button
                key={m.userId}
                type="button"
                className={`grupo-sheets__miembro-chip ${pagadoPor === m.userId ? 'grupo-sheets__miembro-chip--activo' : ''}`}
                onClick={() => setPagadoPor(m.userId)}
              >
                <AvatarMiembro id={m.userId} nombre={m.nombreVisible} />
                {m.userId === miId ? 'Tú' : m.nombreVisible}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="grupo-sheets__modo-partes">
            <p className="grupo-sheets__ayuda">
              {modoPersonalizado ? 'Montos personalizados' : '¿Entre quiénes se divide?'}
            </p>
          </div>

          {!modoPersonalizado ? (
            <div className="grupo-sheets__chips">
              {miembros.map((m) => (
                <button
                  key={m.userId}
                  type="button"
                  className={`grupo-sheets__miembro-chip ${incluidos.has(m.userId) ? 'grupo-sheets__miembro-chip--activo' : 'grupo-sheets__miembro-chip--excluido'}`}
                  onClick={() => alternarIncluido(m.userId)}
                >
                  <AvatarMiembro id={m.userId} nombre={m.nombreVisible} />
                  {m.userId === miId ? 'Tú' : m.nombreVisible}
                </button>
              ))}
            </div>
          ) : (
            <div className="grupo-sheets__partes-personalizadas">
              {miembros.map((m) => (
                <div key={m.userId} className="grupo-sheets__parte-fila">
                  <AvatarMiembro id={m.userId} nombre={m.nombreVisible} />
                  <span>{m.userId === miId ? 'Tú' : m.nombreVisible}</span>
                  <input
                    inputMode="numeric"
                    placeholder="0"
                    value={montosPersonalizados[m.userId] ?? ''}
                    onChange={(e) =>
                      setMontosPersonalizados((prev) => ({
                        ...prev,
                        [m.userId]: e.target.value.replace(/\D/g, ''),
                      }))
                    }
                  />
                </div>
              ))}
              <p className={`grupo-sheets__restante ${restante !== 0 ? 'grupo-sheets__restante--error' : ''}`}>
                {restante === 0
                  ? 'Las partes suman el total ✓'
                  : restante > 0
                    ? `Faltan ${formatearMonto(restante)} por asignar`
                    : `Te pasaste por ${formatearMonto(Math.abs(restante))}`}
              </p>
            </div>
          )}

          <div className="grupo-sheets__modo-partes">
            <button type="button" onClick={() => setModoPersonalizado((v) => !v)}>
              {modoPersonalizado ? 'Usar partes iguales' : 'Usar montos personalizados'}
            </button>
          </div>
        </div>

        {error && <p className="sheet__error">{error}</p>}

        <button className="btn-primario" onClick={manejarGuardar} disabled={guardando || !puedeGuardar}>
          {guardando ? 'Guardando…' : 'Guardar'}
        </button>

        <button className="btn-cancelar" onClick={onCerrar} disabled={guardando}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
