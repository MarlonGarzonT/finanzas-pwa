import { BlockTitle, Button, List } from 'konsta/react';
import { useEffect, useState } from 'react';
import { useCategoriasPorUso } from '../data/useCategoriasPorUso';
import type { Categoria, NuevaTransaccion, Tipo, Transaccion } from '../types';
import { fechaEnMesSeleccionado, fechaLocalISO } from '../utils/fechas';
import { CampoMonto } from './CampoMonto';
import { CampoTexto } from './CampoTexto';
import { DialogoConfirmar } from './DialogoConfirmar';
import { HojaInferior } from './HojaInferior';
import { NuevaCategoriaSheet } from './NuevaCategoriaSheet';
import { SelectorCategoria } from './SelectorCategoria';
import { OpcionSelector, SelectorVidrio } from './SelectorVidrio';

interface Props {
  abierto: boolean;
  categorias: Categoria[];
  transaccion?: Transaccion | null;
  // Mes en el que arranca la fecha de un movimiento nuevo (el que la persona
  // tiene elegido en la pantalla desde la que abrió la hoja).
  mesSeleccionado: Date;
  onCerrar: () => void;
  // `dia`: 'AAAA-MM-DD' elegido en el formulario; la hora la pone quien guarda.
  onGuardar: (datos: NuevaTransaccion & { dia: string }) => Promise<void>;
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
  const [dia, setDia] = useState('');
  const [creandoCategoria, setCreandoCategoria] = useState(false);
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const gastosPorUso = useCategoriasPorUso(categorias, 'egreso');
  const ingresosPorUso = useCategoriasPorUso(categorias, 'ingreso');
  // La preseleccionada es la más usada del tipo, no la primera alfabética.
  const masUsada = (t: Tipo) => (t === 'egreso' ? gastosPorUso : ingresosPorUso)[0]?.id ?? '';

  useEffect(() => {
    if (!abierto) return;
    if (transaccion) {
      setTipo(transaccion.tipo);
      setMonto(String(Math.round(transaccion.monto)));
      setItem(transaccion.item);
      setCategoriaId(transaccion.categoriaId);
      setDia(fechaLocalISO(new Date(transaccion.fecha)));
    } else {
      setTipo('egreso');
      setMonto('');
      setItem('');
      setCategoriaId(masUsada('egreso'));
      // Hoy si se está viendo el mes actual; en otro mes, el mismo número de
      // día (o el último, si no existe). Queda a la vista para cambiarlo.
      setDia(fechaLocalISO(fechaEnMesSeleccionado(mesSeleccionado)));
    }
    setCreandoCategoria(false);
    setGuardando(false);
    setError(null);
    // Sin `categorias` en las dependencias: crear una categoría con la hoja
    // abierta no debe borrar el monto ni la descripción ya escritos.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al abrir/cambiar de transacción
  }, [abierto, transaccion]);

  function manejarCambiarTipo(nuevoTipo: Tipo) {
    setTipo(nuevoTipo);
    setCategoriaId(masUsada(nuevoTipo));
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
    if (!dia) return setError('Elige la fecha del movimiento.');
    setError(null);
    setGuardando(true);
    try {
      await onGuardar({ item: item.trim(), categoriaId, tipo, monto: montoNum, dia });
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
        <BlockTitle className="mt-2">Categoría</BlockTitle>
        <SelectorCategoria
          categorias={tipo === 'egreso' ? gastosPorUso : ingresosPorUso}
          estaElegida={(id) => id === categoriaId}
          onElegir={setCategoriaId}
          onNueva={() => setCreandoCategoria(true)}
        />

        <List strong inset className="mt-5 mb-2">
          <CampoTexto etiqueta="Descripción" valor={item} onCambiar={setItem} placeholder="Almuerzo, Uber, Salario…" />
          {/* La fecha decide en qué mes cuenta el movimiento: se puede registrar
              hoy algo que pasó otro día (el gasto del 31 de octubre anotado el 9). */}
          <CampoTexto etiqueta="Fecha" type="date" valor={dia} onCambiar={setDia} />
        </List>
      </HojaInferior>

      <NuevaCategoriaSheet
        abierto={creandoCategoria}
        tipo={tipo}
        onCerrar={() => setCreandoCategoria(false)}
        onCrear={manejarCrearCategoria}
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
