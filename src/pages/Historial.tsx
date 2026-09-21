import { useMemo, useState } from 'react';
import { HistorialFiltrosSheet } from '../components/HistorialFiltrosSheet';
import { NuevoMovimientoSheet } from '../components/NuevoMovimientoSheet';
import { SelectorPagina } from '../components/SelectorPagina';
import { Spinner } from '../components/Spinner';
import { useFinanzas } from '../data/FinanzasContext';
import type { Transaccion } from '../types';
import { colorCategoria } from '../utils/colorCategoria';
import { formatearFechaCorta, formatearMonto, formatearMontoConSigno, nombreMes } from '../utils/fechas';
import {
  aplicarFiltros,
  contarFiltrosActivos,
  FILTROS_INICIALES,
  type FiltrosHistorial,
} from '../utils/filtrosHistorial';
import './Historial.css';

function capitalizarPrimera(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

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
  const [filtros, setFiltros] = useState<FiltrosHistorial>(FILTROS_INICIALES);
  const [filtrosAbierto, setFiltrosAbierto] = useState(false);

  const categoriaPorId = useMemo(() => {
    const mapa = new Map(categorias.map((c) => [c.id, c]));
    return (id: string) => mapa.get(id);
  }, [categorias]);

  const transaccionesFiltradas = useMemo(
    () => aplicarFiltros(transacciones, categoriaPorId, filtros),
    [transacciones, categoriaPorId, filtros]
  );

  const grupos = useMemo(() => {
    const mapa = new Map<string, Transaccion[]>();
    for (const t of transaccionesFiltradas) {
      const fecha = new Date(t.fecha);
      const clave = capitalizarPrimera(nombreMes(fecha));
      if (!mapa.has(clave)) mapa.set(clave, []);
      mapa.get(clave)!.push(t);
    }
    if (filtros.orden === 'monto') {
      for (const items of mapa.values()) items.sort((a, b) => b.monto - a.monto);
    }
    return Array.from(mapa.entries());
  }, [transaccionesFiltradas, filtros.orden]);

  const totalFiltrado = useMemo(
    () => transaccionesFiltradas.reduce((acc, t) => acc + (t.tipo === 'ingreso' ? t.monto : -t.monto), 0),
    [transaccionesFiltradas]
  );

  const filtrosActivos = contarFiltrosActivos(filtros);
  const hayFiltrosDeChip = filtrosActivos > 0;

  function limpiarCategoria(id: string) {
    setFiltros((prev) => {
      const copia = new Set(prev.categoriaIds);
      copia.delete(id);
      return { ...prev, categoriaIds: copia };
    });
  }

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

        {!cargando && transacciones.length > 0 && (
          <div className="historial__buscador">
            <span aria-hidden>🔎</span>
            <input
              type="search"
              placeholder="Buscar movimiento"
              value={filtros.texto}
              onChange={(e) => setFiltros((prev) => ({ ...prev, texto: e.target.value }))}
            />
          </div>
        )}

        {!cargando && transacciones.length > 0 && (
          <button
            type="button"
            className={`historial__boton-filtros ${filtrosActivos > 0 ? 'historial__boton-filtros--activo' : ''}`}
            onClick={() => setFiltrosAbierto(true)}
            aria-label="Filtros"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
            </svg>
            {filtrosActivos > 0 && <span className="historial__insignia">{filtrosActivos}</span>}
          </button>
        )}
      </header>

      {hayFiltrosDeChip && (
        <div className="historial__chips-activos">
          {Array.from(filtros.categoriaIds).map((id) => {
            const cat = categoriaPorId(id);
            return (
              <button key={id} type="button" className="chip chip--activo" onClick={() => limpiarCategoria(id)}>
                {cat?.emoji} {cat?.nombre ?? 'Categoría'} ✕
              </button>
            );
          })}
          {filtros.tipo !== 'todos' && (
            <button
              type="button"
              className="chip chip--activo"
              onClick={() => setFiltros((prev) => ({ ...prev, tipo: 'todos' }))}
            >
              {filtros.tipo === 'ingreso' ? 'Ingresos' : 'Gastos'} ✕
            </button>
          )}
          {filtros.soloFijos && (
            <button
              type="button"
              className="chip chip--activo"
              onClick={() => setFiltros((prev) => ({ ...prev, soloFijos: false }))}
            >
              📌 Fijos ✕
            </button>
          )}
          {(filtros.montoMin !== null || filtros.montoMax !== null) && (
            <button
              type="button"
              className="chip chip--activo"
              onClick={() => setFiltros((prev) => ({ ...prev, montoMin: null, montoMax: null }))}
            >
              {filtros.montoMin !== null && filtros.montoMax !== null
                ? `${formatearMonto(filtros.montoMin)} – ${formatearMonto(filtros.montoMax)}`
                : filtros.montoMin !== null
                  ? `Desde ${formatearMonto(filtros.montoMin)}`
                  : `Hasta ${formatearMonto(filtros.montoMax!)}`}{' '}
              ✕
            </button>
          )}
          {filtros.mes && (
            <button
              type="button"
              className="chip chip--activo"
              onClick={() => setFiltros((prev) => ({ ...prev, mes: null }))}
            >
              {capitalizarPrimera(nombreMes(filtros.mes))} ✕
            </button>
          )}
          <button type="button" className="chip" onClick={() => setFiltros(FILTROS_INICIALES)}>
            Limpiar todo
          </button>
        </div>
      )}

      {!cargando && transaccionesFiltradas.length > 0 && (
        <p className="historial__total">
          {transaccionesFiltradas.length} movimiento{transaccionesFiltradas.length === 1 ? '' : 's'} ·{' '}
          <span
            className={
              totalFiltrado > 0
                ? 'historial__total-monto--ingreso'
                : totalFiltrado < 0
                  ? 'historial__total-monto--egreso'
                  : undefined
            }
          >
            {formatearMontoConSigno(totalFiltrado)}
          </span>
        </p>
      )}

      {cargando ? (
        <div className="historial__cargando">
          <Spinner />
        </div>
      ) : transacciones.length === 0 ? (
        <p className="historial__vacio">Aún no tienes movimientos registrados.</p>
      ) : transaccionesFiltradas.length === 0 ? (
        <p className="historial__vacio">Ningún movimiento coincide con estos filtros.</p>
      ) : (
        <div className="historial__contenido">
          {grupos.map(([mes, items]) => (
            <section key={mes} className="historial__grupo">
              <h2>{mes}</h2>
              <ul>
                {items.map((t) => {
                  const categoria = categoriaPorId(t.categoriaId);
                  return (
                    <li key={t.id} className="movimiento" onClick={() => setEditando(t)}>
                      <span
                        className="movimiento__icono"
                        style={{ background: `color-mix(in srgb, ${colorCategoria(t.categoriaId)} 22%, var(--surface))` }}
                        aria-hidden
                      >
                        {categoria?.emoji ?? '🏷️'}
                      </span>
                      <div className="movimiento__detalle">
                        <span className="movimiento__item">{t.item}</span>
                        <span className="movimiento__meta">
                          <span className="movimiento__categoria">{categoria?.nombre ?? 'Otros'}</span>
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
                  );
                })}
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

      <HistorialFiltrosSheet
        abierto={filtrosAbierto}
        categorias={categorias}
        filtros={filtros}
        onCerrar={() => setFiltrosAbierto(false)}
        onAplicar={setFiltros}
      />
    </div>
  );
}
