import { useEffect, useState } from 'react';
import type { MiembroGrupo } from '../types';
import type { DeudaSugerida } from '../utils/saldosGrupo';
import { AvatarMiembro } from './AvatarMiembro';
import './GrupoSheets.css';
import { useBloqueoDeFondo, useGestosSheet } from './useComportamientoSheet';

interface Props {
  abierto: boolean;
  miembros: MiembroGrupo[];
  sugerencia: DeudaSugerida | null;
  onCerrar: () => void;
  onRegistrar: (de: string, a: string, monto: number) => Promise<void>;
}

export function RegistrarPagoSheet({ abierto, miembros, sugerencia, onCerrar, onRegistrar }: Props) {
  const [de, setDe] = useState('');
  const [a, setA] = useState('');
  const [monto, setMonto] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useBloqueoDeFondo(abierto);
  const gestos = useGestosSheet(abierto, onCerrar);

  useEffect(() => {
    if (!abierto || !sugerencia) return;
    setDe(sugerencia.de);
    setA(sugerencia.a);
    setMonto(String(sugerencia.monto));
    setError(null);
  }, [abierto, sugerencia]);

  if (!abierto) return null;

  const montoNum = Number(monto) || 0;
  const puedeGuardar = de !== '' && a !== '' && de !== a && montoNum > 0;

  function nombreDe(userId: string) {
    return miembros.find((m) => m.userId === userId)?.nombreVisible ?? 'Alguien';
  }

  async function manejarGuardar() {
    if (!puedeGuardar) return;
    setGuardando(true);
    setError(null);
    try {
      await onRegistrar(de, a, montoNum);
    } catch {
      setError('No se pudo registrar el pago. Intenta de nuevo.');
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
          <h2 className="sheet__titulo">Registrar pago</h2>

          <div className="monto-input">
            <span>$</span>
            <input
              inputMode="numeric"
              placeholder="0"
              value={monto ? Number(monto).toLocaleString('es-CO') : ''}
              onChange={(e) => setMonto(e.target.value.replace(/\D/g, ''))}
            />
          </div>
        </div>

        <div>
          <p className="grupo-sheets__ayuda">¿Quién paga?</p>
          <div className="grupo-sheets__chips">
            {miembros.map((m) => (
              <button
                key={m.userId}
                type="button"
                className={`grupo-sheets__miembro-chip ${de === m.userId ? 'grupo-sheets__miembro-chip--activo' : ''}`}
                onClick={() => setDe(m.userId)}
              >
                <AvatarMiembro id={m.userId} nombre={m.nombreVisible} />
                {m.nombreVisible}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="grupo-sheets__ayuda">¿A quién le paga?</p>
          <div className="grupo-sheets__chips">
            {miembros
              .filter((m) => m.userId !== de)
              .map((m) => (
                <button
                  key={m.userId}
                  type="button"
                  className={`grupo-sheets__miembro-chip ${a === m.userId ? 'grupo-sheets__miembro-chip--activo' : ''}`}
                  onClick={() => setA(m.userId)}
                >
                  <AvatarMiembro id={m.userId} nombre={m.nombreVisible} />
                  {m.nombreVisible}
                </button>
              ))}
          </div>
        </div>

        {de && a && montoNum > 0 && (
          <p className="grupo-sheets__ayuda">
            {nombreDe(de)} le paga {nombreDe(a)}
          </p>
        )}

        {error && <p className="sheet__error">{error}</p>}

        <button className="btn-primario" onClick={manejarGuardar} disabled={guardando || !puedeGuardar}>
          {guardando ? 'Guardando…' : 'Registrar pago'}
        </button>

        <button className="btn-cancelar" onClick={onCerrar} disabled={guardando}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
