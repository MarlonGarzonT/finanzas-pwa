import { BlockFooter, BlockTitle, Button, List, ListItem, Radio, Toggle } from 'konsta/react';
import { lazy, Suspense, useEffect, useId, useState } from 'react';
import { OpcionSelector, SelectorVidrio } from './SelectorVidrio';
import type { Categoria, Naturaleza, Tipo } from '../types';
import {
  ejemplosNaturaleza,
  etiquetaNaturaleza,
  naturalezaAdmiteFijo,
  naturalezasPorTipo,
  sugerirNaturaleza,
} from '../utils/naturalezaCategoria';
import { CampoTexto } from './CampoTexto';
import { DialogoConfirmar } from './DialogoConfirmar';
import { HojaInferior } from './HojaInferior';

const SelectorEmojiSheet = lazy(() =>
  import('./SelectorEmojiSheet').then((m) => ({ default: m.SelectorEmojiSheet }))
);

interface Props {
  abierto: boolean;
  categoria: Categoria | null;
  onCerrar: () => void;
  onGuardar: (
    id: string,
    cambios: { nombre: string; emoji: string; tipo: Tipo; naturaleza: Naturaleza; esFijo: boolean }
  ) => Promise<void>;
  onEliminar: (id: string) => Promise<void>;
}

export function EditarCategoriaSheet({ abierto, categoria, onCerrar, onGuardar, onEliminar }: Props) {
  const [nombre, setNombre] = useState('');
  const [emoji, setEmoji] = useState('🏷️');
  const [tipo, setTipo] = useState<Tipo>('egreso');
  const [naturaleza, setNaturaleza] = useState<Naturaleza>('esencial');
  const [esFijo, setEsFijo] = useState(false);
  const [emojiAbierto, setEmojiAbierto] = useState(false);
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idTituloNaturaleza = useId();
  const admiteFijo = naturalezaAdmiteFijo(naturaleza);

  // Al abrir (o cambiar de categoría), arranca desde los datos reales.
  useEffect(() => {
    if (!abierto || !categoria) return;
    setNombre(categoria.nombre);
    setEmoji(categoria.emoji);
    setTipo(categoria.tipo);
    setNaturaleza(categoria.naturaleza);
    setEsFijo(categoria.esFijo);
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al abrir/cambiar de categoría
  }, [abierto, categoria?.id]);

  // Las naturalezas de egreso no valen para un ingreso (y al revés): al
  // cambiar el tipo se parte de la sugerida para ese nombre.
  function manejarCambiarTipo(nuevoTipo: Tipo) {
    if (nuevoTipo === tipo) return;
    setTipo(nuevoTipo);
    setNaturaleza(sugerirNaturaleza(nombre, nuevoTipo));
  }

  async function manejarGuardar() {
    if (!categoria) return;
    const limpio = nombre.trim();
    if (!limpio) {
      setError('El nombre no puede quedar vacío.');
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      // El ahorro o el pago de tarjeta no son gasto: marcarlos fijos no aplica.
      await onGuardar(categoria.id, { nombre: limpio, emoji, tipo, naturaleza, esFijo: admiteFijo && esFijo });
      onCerrar();
    } catch {
      setError('No se pudo guardar. Intenta de nuevo.');
    } finally {
      setGuardando(false);
    }
  }

  async function manejarEliminar() {
    if (!categoria) return;
    setConfirmandoEliminar(false);
    setGuardando(true);
    try {
      await onEliminar(categoria.id);
      onCerrar();
    } catch {
      setError('No se pudo eliminar. Intenta de nuevo.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <>
      <HojaInferior
        abierto={abierto && categoria !== null}
        titulo="Editar categoría"
        onCerrar={onCerrar}
        cierreBloqueado={guardando}
        pie={
          <>
            {error && (
              <p className="m-0 text-center text-[15px] text-alerta" role="alert">
                {error}
              </p>
            )}
            <Button large rounded onClick={manejarGuardar} disabled={guardando || !nombre.trim()}>
              {guardando ? 'Guardando…' : 'Guardar'}
            </Button>
            <Button large rounded clear className="text-alerta" onClick={() => setConfirmandoEliminar(true)} disabled={guardando}>
              Eliminar categoría
            </Button>
          </>
        }
      >
        <div className="flex justify-center py-3">
          <button
            type="button"
            onClick={() => setEmojiAbierto(true)}
            className="flex flex-col items-center gap-1.5 rounded-2xl px-4 py-2 active:opacity-60"
            aria-label={`Emoji actual ${emoji}. Cambiar emoji`}
          >
            <span className="flex size-20 items-center justify-center rounded-full bg-black/[0.06] text-5xl dark:bg-white/10" aria-hidden="true">
              {emoji}
            </span>
            <span className="text-[15px] text-primary">Cambiar emoji</span>
          </button>
        </div>

        <List strong inset className="my-2">
          <CampoTexto etiqueta="Nombre" valor={nombre} onCambiar={setNombre} placeholder="Nombre de la categoría" />
        </List>

        <div className="px-4 py-2">
          <SelectorVidrio>
            <OpcionSelector active={tipo === 'egreso'} onClick={() => manejarCambiarTipo('egreso')}>
              Gasto
            </OpcionSelector>
            <OpcionSelector active={tipo === 'ingreso'} onClick={() => manejarCambiarTipo('ingreso')}>
              Ingreso
            </OpcionSelector>
          </SelectorVidrio>
        </div>

        <BlockTitle id={idTituloNaturaleza}>Cómo cuenta</BlockTitle>
        <List strong inset role="radiogroup" aria-labelledby={idTituloNaturaleza}>
          {naturalezasPorTipo(tipo).map((opcion) => (
            <ListItem
              key={opcion}
              label
              title={etiquetaNaturaleza(opcion)}
              text={ejemplosNaturaleza(opcion)}
              media={
                <Radio
                  component="div"
                  name="naturaleza"
                  value={opcion}
                  checked={naturaleza === opcion}
                  onChange={() => setNaturaleza(opcion)}
                />
              }
            />
          ))}
        </List>
        <BlockFooter>Define si suma como gasto o ingreso en tu balance y en los reportes.</BlockFooter>

        {admiteFijo && (
          <List strong inset className="my-2">
            <ListItem
              label
              title="Gasto fijo mensual"
              text="Arriendo, cuotas, suscripciones…"
              after={<Toggle checked={esFijo} onChange={() => setEsFijo((v) => !v)} aria-label="Gasto fijo mensual" />}
            />
          </List>
        )}
      </HojaInferior>

      {emojiAbierto && (
        <Suspense fallback={null}>
          <SelectorEmojiSheet
            abierto
            seleccionado={emoji}
            onCerrar={() => setEmojiAbierto(false)}
            onSeleccionar={setEmoji}
          />
        </Suspense>
      )}

      <DialogoConfirmar
        abierto={confirmandoEliminar}
        titulo={`¿Eliminar ${categoria?.nombre ?? 'la categoría'}?`}
        mensaje="Esta acción no se puede deshacer."
        textoConfirmar="Eliminar"
        onConfirmar={manejarEliminar}
        onCancelar={() => setConfirmandoEliminar(false)}
      />
    </>
  );
}
