import { useEffect, useRef, useState } from 'react';
import type { Categoria, Tipo, Transaccion } from '../types';
import { SelectorEmoji } from './SelectorEmoji';
import './NuevoMovimientoSheet.css';

interface Props {
  abierto: boolean;
  categorias: Categoria[];
  transaccion?: Transaccion | null;
  guardando: boolean;
  onCerrar: () => void;
  onGuardar: (datos: { item: string; categoriaId: string; tipo: Tipo; monto: number }) => Promise<void>;
  onEliminar?: () => Promise<void>;
  onCrearCategoria: (nombre: string, emoji: string) => Promise<Categoria>;
}

export function NuevoMovimientoSheet({
  abierto,
  categorias,
  transaccion,
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
  const [creandoCategoria, setCreandoCategoria] = useState(false);
  const [nombreNuevaCategoria, setNombreNuevaCategoria] = useState('');
  const [emojiNuevaCategoria, setEmojiNuevaCategoria] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [espacioTeclado, setEspacioTeclado] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  // En Android, la barra de accesorios del teclado (flechas/check) no se
  // refleja en el alto del viewport de layout: hay que medirla con
  // visualViewport y reservarle espacio, o tapa el campo enfocado.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!abierto || !vv) return;

    function actualizarEspacio() {
      const oculto = window.innerHeight - vv!.height - vv!.offsetTop;
      setEspacioTeclado(Math.max(0, oculto));
    }

    actualizarEspacio();
    vv.addEventListener('resize', actualizarEspacio);
    vv.addEventListener('scroll', actualizarEspacio);
    return () => {
      vv.removeEventListener('resize', actualizarEspacio);
      vv.removeEventListener('scroll', actualizarEspacio);
      setEspacioTeclado(0);
    };
  }, [abierto]);

  function manejarFocoCampo(e: React.FocusEvent<HTMLDivElement>) {
    const campo = e.target;
    if (!(campo instanceof HTMLInputElement)) return;
    // Se espera a que el teclado termine de animarse antes de centrar el campo,
    // si no el cálculo de scroll se hace contra el tamaño previo del viewport.
    setTimeout(() => campo.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
  }

  useEffect(() => {
    if (!abierto) return;
    if (transaccion) {
      setTipo(transaccion.tipo);
      setMonto(String(Math.round(transaccion.monto)));
      setItem(transaccion.item);
      setCategoriaId(transaccion.categoriaId);
    } else {
      setTipo('egreso');
      setMonto('');
      setItem('');
      setCategoriaId(categorias[0]?.id ?? '');
    }
    setCreandoCategoria(false);
    setNombreNuevaCategoria('');
    setEmojiNuevaCategoria(null);
    setError(null);
  }, [abierto, transaccion, categorias]);

  if (!abierto) return null;

  async function manejarCrearCategoria() {
    const nombre = nombreNuevaCategoria.trim();
    if (!nombre || !emojiNuevaCategoria) return;
    const nueva = await onCrearCategoria(nombre, emojiNuevaCategoria);
    setCategoriaId(nueva.id);
    setCreandoCategoria(false);
    setNombreNuevaCategoria('');
    setEmojiNuevaCategoria(null);
  }

  async function manejarGuardar() {
    const montoNum = Number(monto);
    if (!item.trim()) return setError('Escribe qué fue el movimiento.');
    if (!categoriaId) return setError('Elige una categoría.');
    if (!montoNum || montoNum <= 0) return setError('Ingresa un monto válido.');
    setError(null);
    await onGuardar({ item: item.trim(), categoriaId, tipo, monto: montoNum });
  }

  return (
    <div className="sheet-overlay" onClick={onCerrar}>
      <div
        ref={sheetRef}
        className="sheet"
        onClick={(e) => e.stopPropagation()}
        onFocusCapture={manejarFocoCampo}
        style={espacioTeclado ? { paddingBottom: espacioTeclado + 56 } : undefined}
      >
        {/* Fijo (sticky) para que el monto nunca quede oculto tras el teclado,
            sin importar cuánto scroll haga el usuario dentro del sheet. */}
        <div className="sheet__header">
          <div className="sheet__handle" />
          <h2 className="sheet__titulo">{transaccion ? 'Editar movimiento' : 'Nuevo movimiento'}</h2>

          <div className="segmented">
            <button
              type="button"
              className={`segmented__btn segmented__btn--entrada ${tipo === 'ingreso' ? 'segmented__btn--activo' : ''}`}
              onClick={() => setTipo('ingreso')}
            >
              Entrada
            </button>
            <button
              type="button"
              className={`segmented__btn segmented__btn--salida ${tipo === 'egreso' ? 'segmented__btn--activo' : ''}`}
              onClick={() => setTipo('egreso')}
            >
              Salida
            </button>
          </div>

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
          placeholder="¿Qué fue? (ej. Almuerzo, Uber, Salario)"
          value={item}
          onChange={(e) => setItem(e.target.value)}
        />

        <div className="chips">
          {categorias.map((c) => (
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
          {!creandoCategoria && (
            <button type="button" className="chip chip--nueva" onClick={() => setCreandoCategoria(true)}>
              + Nueva
            </button>
          )}
        </div>

        {creandoCategoria && (
          <div className="nueva-categoria-form">
            <div className="nueva-categoria">
              <input
                placeholder="Nombre de la categoría"
                value={nombreNuevaCategoria}
                onChange={(e) => setNombreNuevaCategoria(e.target.value)}
                autoFocus
              />
              <button type="button" onClick={manejarCrearCategoria} disabled={!nombreNuevaCategoria.trim() || !emojiNuevaCategoria}>
                Agregar
              </button>
            </div>
            <SelectorEmoji seleccionado={emojiNuevaCategoria} onSeleccionar={setEmojiNuevaCategoria} />
          </div>
        )}

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
  );
}
