import { useMemo, useState } from 'react';
import { NuevoMovimientoSheet } from '../components/NuevoMovimientoSheet';
import { SelectorPagina } from '../components/SelectorPagina';
import { useFinanzas } from '../data/FinanzasContext';
import type { Transaccion } from '../types';
import { colorCategoria } from '../utils/colorCategoria';
import { formatearFechaCorta, formatearMonto, nombreMes } from '../utils/fechas';
import './Historial.css';

export function Historial() {
  const {
    transacciones,
    categorias,
    cargando,
    actualizarMovimiento,
    eliminarMovimiento,
    crearCategoria,
  } = useFinanzas();
  const [editando, setEditando] = useState<Transaccion | null>(null);
  const [guardando, setGuardando] = useState(false);

  const nombrePorId = useMemo(() => {
    const mapa = new Map(categorias.map((c) => [c.id, c.nombre]));
    return (id: string) => mapa.get(id) ?? 'Otros';
  }, [categorias]);

  const grupos = useMemo(() => {
    const mapa = new Map<string, Transaccion[]>();
    for (const t of transacciones) {
      const fecha = new Date(t.fecha);
      const clave = nombreMes(fecha);
      if (!mapa.has(clave)) mapa.set(clave, []);
      mapa.get(clave)!.push(t);
    }
    return Array.from(mapa.entries());
  }, [transacciones]);

  async function manejarGuardar(datos: {
    item: string;
    categoriaId: string;
    tipo: 'ingreso' | 'egreso';
    monto: number;
  }) {
    if (!editando) return;
    setGuardando(true);
    await actualizarMovimiento(editando.id, datos);
    setGuardando(false);
    setEditando(null);
  }

  async function manejarEliminar() {
    if (!editando) return;
    setGuardando(true);
    await eliminarMovimiento(editando.id);
    setGuardando(false);
    setEditando(null);
  }

  return (
    <div className="historial">
      <header className="historial__header">
        <SelectorPagina />
      </header>

      {cargando ? (
        <p className="historial__vacio">Cargando…</p>
      ) : transacciones.length === 0 ? (
        <p className="historial__vacio">Aún no tienes movimientos registrados.</p>
      ) : (
        <div className="historial__contenido">
          {grupos.map(([mes, items]) => (
            <section key={mes} className="historial__grupo">
              <h2>{mes}</h2>
              <ul>
                {items.map((t) => (
                  <li key={t.id} className="movimiento" onClick={() => setEditando(t)}>
                    <div className={`movimiento__icono movimiento__icono--${t.tipo}`}>
                      {t.tipo === 'ingreso' ? '+' : '−'}
                    </div>
                    <div className="movimiento__detalle">
                      <span className="movimiento__item">{t.item}</span>
                      <span className="movimiento__meta">
                        <span className="movimiento__categoria">
                          <span
                            className="movimiento__categoria-punto"
                            style={{ background: colorCategoria(t.categoriaId) }}
                          />
                          {nombrePorId(t.categoriaId)}
                        </span>
                        <span className="movimiento__meta-separador">·</span>
                        <span>{formatearFechaCorta(t.fecha)}</span>
                        <span className="movimiento__meta-separador">·</span>
                        <span>Sem. {t.semanaDelMes}</span>
                      </span>
                    </div>
                    <span className={`movimiento__monto movimiento__monto--${t.tipo}`}>
                      {t.tipo === 'ingreso' ? '+' : '-'}
                      {formatearMonto(t.monto)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <NuevoMovimientoSheet
        abierto={editando !== null}
        categorias={categorias}
        transaccion={editando}
        guardando={guardando}
        onCerrar={() => setEditando(null)}
        onGuardar={manejarGuardar}
        onEliminar={manejarEliminar}
        onCrearCategoria={crearCategoria}
      />
    </div>
  );
}
