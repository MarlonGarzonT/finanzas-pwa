import { useEffect, useState } from 'react';
import type { Categoria, Tipo, Transaccion } from '../types';
import { nombreMes } from '../utils/fechas';
import { NuevaCategoriaSheet } from './NuevaCategoriaSheet';
import { SelectorMesSheet } from './SelectorMesSheet';
import { useBloqueoDeFondo, useGestosSheet } from './useComportamientoSheet';
import './NuevoMovimientoSheet.css';

function capitalizarPrimera(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

interface Props {
  abierto: boolean;
  categorias: Categoria[];
  transaccion?: Transaccion | null;
  // Mes que debe quedar preseleccionado al crear un movimiento nuevo (el mes
  // que el usuario tiene elegido en la pantalla desde la que abrió el sheet).
  mesSeleccionado: Date;
  guardando: boolean;
  onCerrar: () => void;
  onGuardar: (datos: { item: string; categoriaId: string; tipo: Tipo; monto: number; mes: Date }) => Promise<void>;
  onEliminar?: () => Promise<void>;
  onCrearCategoria: (nombre: string, tipo: Tipo) => Promise<Categoria>;
}

export function NuevoMovimientoSheet({
  abierto,
  categorias,
  transaccion,
  mesSeleccionado,
  guardando,
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
  const [mesSheetAbierto, setMesSheetAbierto] = useState(false);
  const [creandoCategoria, setCreandoCategoria] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useBloqueoDeFondo(abierto);
  const gestos = useGestosSheet(abierto, onCerrar);

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
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al abrir/cambiar de transacción
  }, [abierto, transaccion]);

  if (!abierto) return null;

  const categoriasDelTipo = categorias.filter((c) => c.tipo === tipo);
  const montoTexto = monto ? Number(monto).toLocaleString('es-CO') : '';
  const tamFuenteMonto = montoTexto.length > 12 ? 24 : montoTexto.length > 9 ? 30 : montoTexto.length > 6 ? 36 : 40;

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
    if (!item.trim()) return setError('Escribe qué fue el movimiento.');
    if (!categoriaId) return setError('Elige una categoría.');
    if (!montoNum || montoNum <= 0) return setError('Ingresa un monto válido.');
    setError(null);
    await onGuardar({ item: item.trim(), categoriaId, tipo, monto: montoNum, mes });
  }

  return (
    <>
      <div className="sheet-overlay" onClick={onCerrar} style={gestos.overlayStyle}>
        <div
          className={`sheet ${gestos.arrastrando ? 'sheet--arrastrando' : ''}`}
          onClick={(e) => e.stopPropagation()}
          onFocusCapture={gestos.onFocusCaptureSheet}
          style={gestos.sheetStyle}
        >
          {/* Fijo (sticky) para que el monto nunca quede oculto tras el teclado,
              sin importar cuánto scroll haga el usuario dentro del sheet. */}
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
            <h2 className="sheet__titulo">{transaccion ? 'Editar movimiento' : 'Nuevo movimiento'}</h2>

            <button type="button" className="mes-movimiento" onClick={() => setMesSheetAbierto(true)}>
              🗓️ {capitalizarPrimera(nombreMes(mes))}
            </button>

            <div className="segmented">
              <button
                type="button"
                className={`segmented__btn segmented__btn--entrada ${tipo === 'ingreso' ? 'segmented__btn--activo' : ''}`}
                onClick={() => manejarCambiarTipo('ingreso')}
              >
                Entrada
              </button>
              <button
                type="button"
                className={`segmented__btn segmented__btn--salida ${tipo === 'egreso' ? 'segmented__btn--activo' : ''}`}
                onClick={() => manejarCambiarTipo('egreso')}
              >
                Salida
              </button>
            </div>

            <div className="monto-input">
              <span>$</span>
              <input
                inputMode="numeric"
                placeholder="0"
                value={montoTexto}
                onChange={(e) => setMonto(e.target.value.replace(/\D/g, ''))}
                style={{ fontSize: tamFuenteMonto }}
                autoFocus
              />
            </div>
          </div>

          <input
            className="texto-input"
            placeholder="¿Qué fue? (ej. Almuerzo, Uber, Salario)"
            value={item}
            onChange={(e) => setItem(e.target.value)}
          />

          <div className="chips">
            {categoriasDelTipo.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`chip ${categoriaId === c.id ? 'chip--activo' : ''}`}
                onClick={() => setCategoriaId(c.id)}
              >
                <span aria-hidden>{c.emoji}</span>
                {c.nombre}
              </button>
            ))}
            <button type="button" className="chip chip--nueva" onClick={() => setCreandoCategoria(true)}>
              + Nueva
            </button>
          </div>

          {error && <p className="sheet__error">{error}</p>}

          <button className="btn-primario" onClick={manejarGuardar} disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar'}
          </button>

          {transaccion && onEliminar && (
            <button className="btn-eliminar" onClick={onEliminar} disabled={guardando}>
              Eliminar movimiento
            </button>
          )}

          <button className="btn-cancelar" onClick={onCerrar} disabled={guardando}>
            Cancelar
          </button>
        </div>
      </div>

      <NuevaCategoriaSheet
        abierto={creandoCategoria}
        tipo={tipo}
        onCerrar={() => setCreandoCategoria(false)}
        onCrear={manejarCrearCategoria}
      />

      <SelectorMesSheet
        abierto={mesSheetAbierto}
        mes={mes}
        onCerrar={() => setMesSheetAbierto(false)}
        onSeleccionar={setMes}
        anidado
      />
    </>
  );
}
