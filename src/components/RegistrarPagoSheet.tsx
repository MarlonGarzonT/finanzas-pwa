import { BlockTitle, Button } from 'konsta/react';
import { useEffect, useState } from 'react';
import type { MiembroGrupo } from '../types';
import { formatearMonto } from '../utils/fechas';
import type { DeudaSugerida } from '../utils/saldosGrupo';
import { AvatarMiembro } from './AvatarMiembro';
import { CampoMonto } from './CampoMonto';
import { ChipOpcion } from './ChipOpcion';
import { HojaInferior } from './HojaInferior';

interface Props {
  abierto: boolean;
  miembros: MiembroGrupo[];
  miId: string;
  sugerencia: DeudaSugerida | null;
  onCerrar: () => void;
  onRegistrar: (de: string, a: string, monto: number) => Promise<void>;
}

export function RegistrarPagoSheet({ abierto, miembros, miId, sugerencia, onCerrar, onRegistrar }: Props) {
  const [de, setDe] = useState('');
  const [a, setA] = useState('');
  const [monto, setMonto] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!abierto || !sugerencia) return;
    setDe(sugerencia.de);
    setA(sugerencia.a);
    setMonto(String(sugerencia.monto));
    setError(null);
  }, [abierto, sugerencia]);

  const montoNum = Number(monto) || 0;
  const puedeGuardar = de !== '' && a !== '' && de !== a && montoNum > 0;

  function nombreDe(userId: string) {
    if (userId === miId) return 'Tú';
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
    } finally {
      setGuardando(false);
    }
  }

  return (
    <HojaInferior
      abierto={abierto}
      titulo="Registrar pago"
      onCerrar={onCerrar}
      cierreBloqueado={guardando}
      cabecera={
        <div className="px-4 pb-2">
          <CampoMonto valor={monto} onCambiar={setMonto} etiqueta="Monto del pago" />
        </div>
      }
      pie={
        <>
          {error && (
            <p className="m-0 text-center text-[15px] text-alerta" role="alert">
              {error}
            </p>
          )}
          <Button large rounded onClick={manejarGuardar} disabled={guardando || !puedeGuardar}>
            {guardando ? 'Guardando…' : 'Registrar pago'}
          </Button>
        </>
      }
    >
      <BlockTitle className="mt-2">¿Quién paga?</BlockTitle>
      <div className="flex flex-wrap gap-2 px-4" role="group" aria-label="Quién paga">
        {miembros.map((m) => (
          <ChipOpcion
            key={m.userId}
            activo={de === m.userId}
            onClick={() => {
              setDe(m.userId);
              if (a === m.userId) setA('');
            }}
            media={<AvatarMiembro id={m.userId} nombre={m.nombreVisible} tamano="sm" />}
          >
            {nombreDe(m.userId)}
          </ChipOpcion>
        ))}
      </div>

      <BlockTitle>¿A quién le paga?</BlockTitle>
      <div className="flex flex-wrap gap-2 px-4" role="group" aria-label="A quién le paga">
        {miembros
          .filter((m) => m.userId !== de)
          .map((m) => (
            <ChipOpcion
              key={m.userId}
              activo={a === m.userId}
              onClick={() => setA(m.userId)}
              media={<AvatarMiembro id={m.userId} nombre={m.nombreVisible} tamano="sm" />}
            >
              {nombreDe(m.userId)}
            </ChipOpcion>
          ))}
      </div>

      {puedeGuardar && (
        <p className="mx-4 mt-4 mb-0 text-[15px] text-secundario cifras" aria-live="polite">
          {nombreDe(de)} {de === miId ? 'le pagas' : 'le paga'} {formatearMonto(montoNum)} a {a === miId ? 'ti' : nombreDe(a)}.
        </p>
      )}
    </HojaInferior>
  );
}
