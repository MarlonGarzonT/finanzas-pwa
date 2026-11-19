import { useEffect, useRef, useState } from 'react';
import { useCategoriasPorUso } from '../data/useCategoriasPorUso';
import type { Categoria, NuevaTransaccion, Tipo, Transaccion } from '../types';
import { fechaEnMesSeleccionado, fechaLocalISO } from '../utils/fechas';

export type DatosMovimiento = NuevaTransaccion & { dia: string };

export const PASOS_MOVIMIENTO = ['Monto', 'Categoría', 'Detalle'] as const;
const ULTIMO_PASO = PASOS_MOVIMIENTO.length - 1;
// Lo justo para ver el aro y el ✓ de la categoría elegida antes de que la
// hoja avance al paso siguiente.
const PAUSA_AL_ELEGIR_MS = 260;

interface Argumentos {
  abierto: boolean;
  categorias: Categoria[];
  transaccion?: Transaccion | null;
  mesSeleccionado: Date;
  onGuardar: (datos: DatosMovimiento) => Promise<void>;
}

// Estado y reglas del formulario de movimientos. Un movimiento nuevo se llena
// por pasos (monto → categoría → detalle); al editar, la hoja muestra todos
// los campos a la vez y el paso no se usa.
export function useFormularioMovimiento({ abierto, categorias, transaccion, mesSeleccionado, onGuardar }: Argumentos) {
  const [tipo, setTipo] = useState<Tipo>('egreso');
  const [monto, setMonto] = useState('');
  const [item, setItem] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [dia, setDia] = useState('');
  const [paso, setPaso] = useState(0);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const temporizadorAvance = useRef<number | undefined>(undefined);
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
    setPaso(0);
    setGuardando(false);
    setError(null);
    // Sin `categorias` en las dependencias: crear una categoría con la hoja
    // abierta no debe borrar el monto ni la descripción ya escritos.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al abrir/cambiar de transacción
  }, [abierto, transaccion]);

  // Un avance pendiente (al elegir categoría) no debe dispararse si la
  // persona ya navegó a otro paso o cerró la hoja.
  useEffect(() => () => window.clearTimeout(temporizadorAvance.current), []);

  function irAlPaso(destino: number) {
    window.clearTimeout(temporizadorAvance.current);
    setError(null);
    // El teclado se cierra al salir de un campo: si no, en iPhone taparía la
    // mitad de la cuadrícula de categorías. (El último paso abre el suyo al
    // enfocar la descripción.)
    if (destino < ULTIMO_PASO && document.activeElement instanceof HTMLElement) document.activeElement.blur();
    setPaso(Math.max(0, Math.min(destino, ULTIMO_PASO)));
  }

  function cambiarTipo(nuevoTipo: Tipo) {
    setTipo(nuevoTipo);
    setCategoriaId(masUsada(nuevoTipo));
  }

  function elegirCategoria(id: string, avanzar: boolean) {
    setCategoriaId(id);
    if (!avanzar) return;
    window.clearTimeout(temporizadorAvance.current);
    temporizadorAvance.current = window.setTimeout(() => setPaso((actual) => (actual === 1 ? 2 : actual)), PAUSA_AL_ELEGIR_MS);
  }

  const montoValido = Number(monto) > 0;

  async function guardar() {
    // Cada falta lleva al paso donde se corrige (al editar, no hay pasos).
    if (!montoValido) {
      setPaso(0);
      return setError('Ingresa un monto mayor a cero.');
    }
    if (!categoriaId) {
      setPaso(1);
      return setError('Elige una categoría.');
    }
    if (!item.trim()) return setError('Escribe qué fue el movimiento.');
    if (!dia) return setError('Elige la fecha del movimiento.');
    setError(null);
    setGuardando(true);
    try {
      await onGuardar({ item: item.trim(), categoriaId, tipo, monto: Number(monto), dia });
    } catch {
      setError('No se pudo guardar. Revisa tu conexión e intenta de nuevo.');
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(onEliminar: () => Promise<void>) {
    setGuardando(true);
    try {
      await onEliminar();
    } catch {
      setError('No se pudo eliminar. Intenta de nuevo.');
    } finally {
      setGuardando(false);
    }
  }

  return {
    tipo,
    monto,
    item,
    categoriaId,
    dia,
    paso,
    guardando,
    error,
    montoValido,
    categoriasDelTipo: tipo === 'egreso' ? gastosPorUso : ingresosPorUso,
    setMonto,
    setItem,
    setDia,
    setCategoriaId,
    cambiarTipo,
    elegirCategoria,
    irAlPaso,
    guardar,
    eliminar,
  };
}
