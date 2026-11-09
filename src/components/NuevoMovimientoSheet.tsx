import { BlockTitle, Button, List, ListItem } from 'konsta/react';
import { useEffect, useState } from 'react';
import { OpcionSelector, SelectorVidrio } from './SelectorVidrio';
import type { Categoria, NuevaTransaccion, Tipo, Transaccion } from '../types';
import { capitalizarPrimera, nombreMes } from '../utils/fechas';
import { CampoMonto } from './CampoMonto';
import { CampoTexto } from './CampoTexto';
import { ChipOpcion } from './ChipOpcion';
import { DialogoConfirmar } from './DialogoConfirmar';
import { HojaInferior } from './HojaInferior';
import { NuevaCategoriaSheet } from './NuevaCategoriaSheet';
import { SelectorMesSheet } from './SelectorMesSheet';

interface Props {
  abierto: boolean;
  categorias: Categoria[];
  transaccion?: Transaccion | null;
  // Mes que queda preseleccionado al crear un movimiento nuevo (el que la
  // persona tiene elegido en la pantalla desde la que abrió la hoja).
  mesSeleccionado: Date;
  onCerrar: () => void;
  onGuardar: (datos: NuevaTransaccion & { mes: Date }) => Promise<void>;
  onEliminar?: () => Promise<void>;
  onCrearCategoria: (nombre: string, tipo: Tipo) => Promise<Categoria>;
}

export function NuevoMovimientoSheet({
  abierto,
  categorias,
  transaccion,
  mesSeleccionado,
  onCerrar,
  onGuardar,
  onEliminar,
  onCrearCategoria,
}: Props) {
  const [tipo, setTipo] = useState<Tipo>('egreso');
  const [monto, setMonto] = useState('');
  const [item, setItem] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [mes, setMes] = useState(mesSeleccionado);
  const [mesAbierto, setMesAbierto] = useState(false);
  const [creandoCategoria, setCreandoCategoria] = useState(false);
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!abierto) return;
    if (transaccion) {
      setTipo(transaccion.tipo);
      setMonto(String(Math.round(transaccion.monto)));
      setItem(transaccion.item);
      setCategoriaId(transaccion.categoriaId);
      setMes(new Date(transaccion.fecha));
    } else {
      setTipo('egreso');
      setMonto('');
      setItem('');
      setCategoriaId(categorias.find((c) => c.tipo === 'egreso')?.id ?? '');
      setMes(mesSeleccionado);
    }
    setCreandoCategoria(false);
    setGuardando(false);
    setError(null);
    // Sin `categorias` en las dependencias: crear una categoría con la hoja
    // abierta no debe borrar el monto ni la descripción ya escritos.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al abrir/cambiar de transacción
  }, [abierto, transaccion]);

  const categoriasDelTipo = categorias.filter((c) => c.tipo === tipo);

  function manejarCambiarTipo(nuevoTipo: Tipo) {
    setTipo(nuevoTipo);
    setCategoriaId(categorias.find((c) => c.tipo === nuevoTipo)?.id ?? '');
  }

  async function manejarCrearCategoria(nombre: string) {
    const nueva = await onCrearCategoria(nombre, tipo);
    setCategoriaId(nueva.id);
    setCreandoCategoria(false);
  }

  async function manejarGuardar() {
    const montoNum = Number(monto);
    if (!montoNum || montoNum <= 0) return setError('Ingresa un monto mayor a cero.');
    if (!item.trim()) return setError('Escribe qué fue el movimiento.');
    if (!categoriaId) return setError('Elige una categoría.');
    setError(null);
    setGuardando(true);
    try {
      await onGuardar({ item: item.trim(), categoriaId, tipo, monto: montoNum, mes });
    } catch {
      setError('No se pudo guardar. Revisa tu conexión e intenta de nuevo.');
    } finally {
      setGuardando(false);
    }
  }

  async function manejarEliminar() {
    if (!onEliminar) return;
    setConfirmandoEliminar(false);
    setGuardando(true);
    try {
      await onEliminar();
    } catch {
      setError('No se pudo eliminar. Intenta de nuevo.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <>
      <HojaInferior
        abierto={abierto}
        titulo={transaccion ? 'Editar movimiento' : 'Nuevo movimiento'}
        onCerrar={onCerrar}
        cierreBloqueado={guardando}
        cabecera={
          <div className="flex flex-col gap-3 px-4 pb-3">
            <SelectorVidrio>
              <OpcionSelector
                active={tipo === 'egreso'}
                onClick={() => manejarCambiarTipo('egreso')}
              >
                Salida
              </OpcionSelector>
              <OpcionSelector
                active={tipo === 'ingreso'}
                onClick={() => manejarCambiarTipo('ingreso')}
              >
                Entrada
              </OpcionSelector>
            </SelectorVidrio>
            <CampoMonto valor={monto} onCambiar={setMonto} tono={tipo} autoFocus={!transaccion} />
          </div>
        }
        pie={
          <>
            {error && (
              <p className="m-0 text-center text-[15px] text-alerta" role="alert">
                {error}
              </p>
            )}
            <Button large rounded onClick={manejarGuardar} disabled={guardando}>
              {guardando ? 'Guardando…' : 'Guardar'}
            </Button>
            {transaccion && onEliminar && (
              <Button large rounded clear className="text-alerta" onClick={() => setConfirmandoEliminar(true)} disabled={guardando}>
                Eliminar movimiento
              </Button>
            )}
          </>
        }
      >
        <List strong inset className="my-2">
          <CampoTexto etiqueta="Descripción" valor={item} onCambiar={setItem} placeholder="Almuerzo, Uber, Salario…" />
          {/* El mes decide en qué contabilidad mensual cae el movimiento: se
              puede registrar hoy algo que pertenece a otro mes. */}
          <ListItem
            link
            linkComponent="button"
            linkProps={{ type: 'button', 'aria-label': `Mes: ${capitalizarPrimera(nombreMes(mes))}. Cambiar` }}
            onClick={() => setMesAbierto(true)}
            title="Mes"
            after={capitalizarPrimera(nombreMes(mes))}
            contentClassName="w-full text-left"
          />
        </List>

        <BlockTitle className="mt-4">Categoría</BlockTitle>
        <div className="flex flex-wrap gap-2 px-4" role="group" aria-label="Categoría">
          {categoriasDelTipo.map((c) => (
            <ChipOpcion key={c.id} activo={categoriaId === c.id} onClick={() => setCategoriaId(c.id)} media={<span aria-hidden="true">{c.emoji}</span>}>
              {c.nombre}
            </ChipOpcion>
          ))}
          <ChipOpcion activo={false} onClick={() => setCreandoCategoria(true)}>
            <span className="text-primary">+ Nueva</span>
          </ChipOpcion>
        </div>
      </HojaInferior>

      <NuevaCategoriaSheet
        abierto={creandoCategoria}
        tipo={tipo}
        onCerrar={() => setCreandoCategoria(false)}
        onCrear={manejarCrearCategoria}
      />

      <SelectorMesSheet
        abierto={mesAbierto}
        mes={mes}
        onCerrar={() => setMesAbierto(false)}
        onSeleccionar={setMes}
      />

      <DialogoConfirmar
        abierto={confirmandoEliminar}
        titulo="¿Eliminar movimiento?"
        mensaje="Se quitará de tu historial y de los totales del mes. No se puede deshacer."
        textoConfirmar="Eliminar"
        onConfirmar={manejarEliminar}
        onCancelar={() => setConfirmandoEliminar(false)}
      />
    </>
  );
}
