import { BlockFooter, BlockTitle, Button, List, ListItem } from 'konsta/react';
import { useEffect, useState } from 'react';
import { OpcionSelector, SelectorVidrio } from './SelectorVidrio';
import type { MiembroGrupo, NuevoGastoGrupo } from '../types';
import { formatearMonto } from '../utils/fechas';
import { AvatarMiembro } from './AvatarMiembro';
import { CampoMonto } from './CampoMonto';
import { CampoTexto } from './CampoTexto';
import { ChipOpcion } from './ChipOpcion';
import { HojaInferior } from './HojaInferior';

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

  const montoNum = Number(monto) || 0;
  const nombre = (m: MiembroGrupo) => (m.userId === miId ? 'Tú' : m.nombreVisible);

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

  const estadoReparto =
    restante === 0
      ? 'Las partes suman el total.'
      : restante > 0
        ? `Faltan ${formatearMonto(restante)} por asignar.`
        : `Te pasaste por ${formatearMonto(Math.abs(restante))}.`;

  return (
    <HojaInferior
      abierto={abierto}
      titulo="Nuevo gasto"
      onCerrar={onCerrar}
      cierreBloqueado={guardando}
      cabecera={
        <div className="px-4 pb-2">
          <CampoMonto valor={monto} onCambiar={setMonto} autoFocus />
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
            {guardando ? 'Guardando…' : 'Guardar gasto'}
          </Button>
        </>
      }
    >
      <List strong inset className="my-2">
        <CampoTexto etiqueta="Descripción" valor={descripcion} onCambiar={setDescripcion} placeholder="Comida, Hospedaje, Gasolina…" />
      </List>

      <BlockTitle>¿Quién pagó?</BlockTitle>
      <div className="flex flex-wrap gap-2 px-4" role="group" aria-label="Quién pagó">
        {miembros.map((m) => (
          <ChipOpcion
            key={m.userId}
            activo={pagadoPor === m.userId}
            onClick={() => setPagadoPor(m.userId)}
            media={<AvatarMiembro id={m.userId} nombre={m.nombreVisible} tamano="sm" />}
          >
            {nombre(m)}
          </ChipOpcion>
        ))}
      </div>

      <BlockTitle>¿Cómo se divide?</BlockTitle>
      <div className="px-4">
        <SelectorVidrio>
          <OpcionSelector active={!modoPersonalizado} onClick={() => setModoPersonalizado(false)}>
            Partes iguales
          </OpcionSelector>
          <OpcionSelector active={modoPersonalizado} onClick={() => setModoPersonalizado(true)}>
            Montos exactos
          </OpcionSelector>
        </SelectorVidrio>
      </div>

      {!modoPersonalizado ? (
        <>
          <div className="mt-4 flex flex-wrap gap-2 px-4" role="group" aria-label="Entre quiénes se divide">
            {miembros.map((m) => (
              <ChipOpcion
                key={m.userId}
                activo={incluidos.has(m.userId)}
                onClick={() => alternarIncluido(m.userId)}
                media={<AvatarMiembro id={m.userId} nombre={m.nombreVisible} tamano="sm" />}
              >
                {nombre(m)}
              </ChipOpcion>
            ))}
          </div>
          <p className="mx-4 mt-4 mb-0 text-[15px] text-secundario cifras">
            {incluidos.size > 0 && montoNum > 0
              ? `${formatearMonto(Math.floor(montoNum / incluidos.size))} por persona aprox.`
              : 'Toca a una persona para sacarla o incluirla en el reparto.'}
          </p>
        </>
      ) : (
        <>
          <List strong inset dividers className="mt-4 mb-0">
            {miembros.map((m) => (
              <ListItem
                key={m.userId}
                media={<AvatarMiembro id={m.userId} nombre={m.nombreVisible} tamano="sm" />}
                title={nombre(m)}
                after={
                  <label className="flex items-center gap-1">
                    <span className="sr-only">Parte de {nombre(m)}</span>
                    <span className="text-secundario" aria-hidden="true">
                      $
                    </span>
                    <input
                      inputMode="numeric"
                      enterKeyHint="next"
                      placeholder="0"
                      value={montosPersonalizados[m.userId] ? Number(montosPersonalizados[m.userId]).toLocaleString('es-CO') : ''}
                      onChange={(e) =>
                        setMontosPersonalizados((prev) => ({ ...prev, [m.userId]: e.target.value.replace(/\D/g, '') }))
                      }
                      className="h-11 w-28 bg-transparent text-right text-[17px] text-black cifras placeholder-black/55 focus:outline-none dark:text-white dark:placeholder-white/50"
                    />
                  </label>
                }
              />
            ))}
          </List>
          <BlockFooter className={`cifras ${restante !== 0 ? 'font-semibold text-alerta' : ''}`} aria-live="polite">
            {estadoReparto}
          </BlockFooter>
        </>
      )}
    </HojaInferior>
  );
}
