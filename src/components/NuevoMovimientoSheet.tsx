import { useEffect, useState } from 'react';
import type { Categoria, Tipo, Transaccion } from '../types';
import './NuevoMovimientoSheet.css';

interface Props {
  abierto: boolean;
  categorias: Categoria[];
  transaccion?: Transaccion | null;
  guardando: boolean;
  onCerrar: () => void;
  onGuardar: (datos: { item: string; categoriaId: string; tipo: Tipo; monto: number }) => Promise<void>;
  onEliminar?: () => Promise<void>;
  onCrearCategoria: (nombre: string) => Promise<Categoria>;
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!abierto) return;
    if (transaccion) {
      setTipo(transaccion.tipo);
      setMonto(String(transaccion.monto));
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
    setError(null);
  }, [abierto, transaccion, categorias]);

  if (!abierto) return null;

  async function manejarCrearCategoria() {
    const nombre = nombreNuevaCategoria.trim();
    if (!nombre) return;
    const nueva = await onCrearCategoria(nombre);
    setCategoriaId(nueva.id);
    setCreandoCategoria(false);
    setNombreNuevaCategoria('');
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
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
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
            inputMode="decimal"
            placeholder="0"
            value={monto}
            onChange={(e) => setMonto(e.target.value.replace(/[^0-9.]/g, ''))}
            autoFocus
          />
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
          <div className="nueva-categoria">
            <input
              placeholder="Nombre de la categoría"
              value={nombreNuevaCategoria}
              onChange={(e) => setNombreNuevaCategoria(e.target.value)}
              autoFocus
            />
            <button type="button" onClick={manejarCrearCategoria}>
              Agregar
            </button>
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
