import { BlockFooter, BlockTitle, Button, List, ListItem } from 'konsta/react';
import { useState } from 'react';
import { OpcionSelector, SelectorVidrio } from './SelectorVidrio';
import type { CambiosCategoria, Categoria, Tipo } from '../types';
import { colorCategoria } from '../utils/colorCategoria';
import { AvatarEmoji } from './AvatarEmoji';
import { CampoTexto } from './CampoTexto';
import { EditarCategoriaSheet } from './EditarCategoriaSheet';
import { HojaInferior } from './HojaInferior';
import { IconoFijo } from './Iconos';

interface Props {
  abierto: boolean;
  categorias: Categoria[];
  onCerrar: () => void;
  onCrear: (nombre: string, tipo: Tipo) => Promise<void>;
  onActualizar: (id: string, cambios: CambiosCategoria) => Promise<void>;
  onEliminar: (id: string) => Promise<void>;
}

export function GestionCategorias({ abierto, categorias, onCerrar, onCrear, onActualizar, onEliminar }: Props) {
  const [nombre, setNombre] = useState('');
  const [tipoNueva, setTipoNueva] = useState<Tipo>('egreso');
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  async function manejarCrear() {
    const limpio = nombre.trim();
    if (!limpio) return;
    setOcupado(true);
    setError(null);
    try {
      await onCrear(limpio, tipoNueva);
      setNombre('');
    } catch {
      setError('No se pudo agregar la categoría. Intenta de nuevo.');
    } finally {
      setOcupado(false);
    }
  }

  const gastos = categorias.filter((c) => c.tipo === 'egreso');
  const ingresos = categorias.filter((c) => c.tipo === 'ingreso');

  function filas(lista: Categoria[]) {
    return lista.map((c) => (
      <ListItem
        key={c.id}
        link
        linkComponent="button"
        linkProps={{ type: 'button', 'aria-label': `Editar ${c.nombre}` }}
        onClick={() => setEditandoId(c.id)}
        media={<AvatarEmoji emoji={c.emoji} color={colorCategoria(c.id)} />}
        title={c.nombre}
        after={
          c.esFijo ? (
            <span className="flex items-center gap-1 text-[15px] text-secundario">
              <IconoFijo className="size-4" />
              Fijo
            </span>
          ) : undefined
        }
        contentClassName="w-full text-left"
      />
    ));
  }

  return (
    <>
      <HojaInferior abierto={abierto} titulo="Categorías" onCerrar={onCerrar} textoCerrar="Cerrar">
        <BlockTitle className="mt-2">Gastos</BlockTitle>
        <List strong inset dividers>
          {gastos.length ? filas(gastos) : <ListItem title={<span className="text-secundario">Sin categorías de gasto.</span>} />}
        </List>

        <BlockTitle>Ingresos</BlockTitle>
        <List strong inset dividers>
          {ingresos.length ? filas(ingresos) : <ListItem title={<span className="text-secundario">Sin categorías de ingreso.</span>} />}
        </List>
        <BlockFooter>Toca una categoría para cambiar su nombre, emoji, tipo o marcarla como gasto fijo.</BlockFooter>

        <BlockTitle>Nueva categoría</BlockTitle>
        <List strong inset>
          <CampoTexto etiqueta="Nombre" valor={nombre} onCambiar={setNombre} placeholder="Mercado, Gimnasio…" />
        </List>
        <div className="flex flex-col gap-3 px-4 pt-3">
          <SelectorVidrio>
            <OpcionSelector active={tipoNueva === 'egreso'} onClick={() => setTipoNueva('egreso')}>
              Gasto
            </OpcionSelector>
            <OpcionSelector active={tipoNueva === 'ingreso'} onClick={() => setTipoNueva('ingreso')}>
              Ingreso
            </OpcionSelector>
          </SelectorVidrio>
          {error && (
            <p className="m-0 text-center text-[15px] text-alerta" role="alert">
              {error}
            </p>
          )}
          <Button large rounded tonal onClick={manejarCrear} disabled={ocupado || !nombre.trim()}>
            {ocupado ? 'Agregando…' : 'Agregar categoría'}
          </Button>
        </div>
        <div className="pb-safe-4" />
      </HojaInferior>

      <EditarCategoriaSheet
        abierto={editandoId !== null}
        categoria={categorias.find((c) => c.id === editandoId) ?? null}
        onCerrar={() => setEditandoId(null)}
        onGuardar={onActualizar}
        onEliminar={onEliminar}
      />
    </>
  );
}
