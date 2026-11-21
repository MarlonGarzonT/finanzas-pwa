import { Preloader } from 'konsta/react';
import { useMemo, useState } from 'react';
import type { DatosHistorial } from '../data/useHistorial';
import { useFinanzas } from '../data/FinanzasContext';
import { colorCategoria } from '../utils/colorCategoria';
import { resumirMes } from '../utils/contabilidad';
import { fechaConHora, formatearFechaCorta, formatearMonto, formatearMontoConSigno, nombreMes, capitalizarPrimera, claveMes } from '../utils/fechas';
import { FILTROS_INICIALES, type FiltrosHistorial } from '../utils/filtrosHistorial';
import { presentacionMovimiento } from '../utils/presentacionMovimiento';
import type { NuevaTransaccion } from '../types';
import { BotonPrincipal } from './BotonPrincipal';
import { Cargando } from './Cargando';
import { ChipsFiltrosActivos } from './ChipsFiltrosActivos';
import { EncabezadoWeb } from './EncabezadoWeb';
import { IconoDescargar, IconoFiltro } from './Iconos';
import { NuevoMovimientoSheet } from './NuevoMovimientoSheet';
import { Aviso, Segmentos } from './Segmentos';
import { OpcionSelector, SelectorVidrio } from './SelectorVidrio';
import { SuperficieVidrio } from './SuperficieVidrio';

interface Props {
  datos: DatosHistorial;
}

const COLOR_NETO = (valor: number) => (valor > 0 ? 'text-ingreso' : valor < 0 ? 'text-alerta' : 'text-secundario');

// El Historial para web: una barra de búsqueda y filtros arriba, los totales de
// lo que se está viendo en segmentos y, debajo, una tabla con el movimiento, su
// categoría y su monto; cada mes con su balance. La fila entera abre la edición
// (la hoja entra por la derecha).
export function HistorialEscritorio({ datos: h }: Props) {
  const { crearMovimiento } = useFinanzas();
  const [creando, setCreando] = useState(false);
  const { filtros, setFiltros } = h;

  // Los meses con movimientos, para el filtro de mes (el más reciente primero).
  const mesesConDatos = useMemo(() => {
    const claves = new Map<string, Date>();
    for (const t of h.transacciones) {
      const clave = claveMes(t.fecha);
      if (!claves.has(clave)) {
        const f = new Date(t.fecha);
        claves.set(clave, new Date(f.getFullYear(), f.getMonth(), 1));
      }
    }
    return [...claves.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [h.transacciones]);

  const claveMesFiltro = filtros.mes ? `${filtros.mes.getFullYear()}-${String(filtros.mes.getMonth() + 1).padStart(2, '0')}` : '';

  function cambiarFiltro(cambio: Partial<FiltrosHistorial>) {
    setFiltros((prev) => ({ ...prev, ...cambio }));
  }

  async function crear({ dia, ...resto }: NuevaTransaccion & { dia: string }) {
    await crearMovimiento(resto, fechaConHora(dia, new Date()));
    setCreando(false);
  }

  const { ingresos, gastos } = h.resumenFiltrado;

  return (
    <>
      <EncabezadoWeb
        titulo="Historial"
        acciones={
          h.hayMovimientos ? (
            <>
              <button
                type="button"
                onClick={h.excel.exportar}
                disabled={h.excel.exportando}
                aria-busy={h.excel.exportando}
                className="flex h-12 items-center gap-2 rounded-full bg-black/[0.05] px-5 text-[15px] font-semibold transition-colors hover:bg-black/[0.08] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60 dark:bg-white/[0.08] dark:hover:bg-white/[0.12]"
              >
                {h.excel.exportando ? <Preloader className="size-5" /> : <IconoDescargar className="size-5" />}
                Exportar a Excel
              </button>
              <div className="w-[230px]">
                <BotonPrincipal texto="Nuevo movimiento" onClick={() => setCreando(true)} efectos={false} />
              </div>
            </>
          ) : undefined
        }
      />

      <div className="mx-auto w-full max-w-[1480px] px-8 pb-8">
        {h.excel.error && (
          <div className="mb-4">
            <Aviso>{h.excel.error}</Aviso>
          </div>
        )}

        {h.cargando ? (
          <Cargando />
        ) : h.transacciones.length === 0 ? (
          <div className="mx-auto max-w-xl pt-8">
            <Aviso>Aún no tienes movimientos. Registra el primero con "Nuevo movimiento" en el Tablero.</Aviso>
            <div className="mt-4 w-[230px]">
              <BotonPrincipal texto="Nuevo movimiento" onClick={() => setCreando(true)} efectos={false} />
            </div>
          </div>
        ) : (
          <div className="aparecer-suave">
            {/* Búsqueda y filtros */}
            <SuperficieVidrio className="p-3">
              <div className="flex flex-wrap items-center gap-3">
                <label className="relative min-w-[200px] flex-1">
                  <span className="sr-only">Buscar movimiento</span>
                  <input
                    type="search"
                    value={filtros.texto}
                    onChange={(e) => cambiarFiltro({ texto: e.target.value })}
                    placeholder="Buscar movimiento"
                    autoComplete="off"
                    className="h-12 w-full rounded-2xl bg-black/[0.05] px-4 text-[16px] placeholder-black/50 focus:outline-2 focus:outline-offset-1 focus:outline-primary dark:bg-white/[0.08] dark:placeholder-white/50"
                  />
                </label>
                <div className="w-[250px]">
                  <SelectorVidrio>
                    <OpcionSelector active={filtros.tipo === 'todos'} onClick={() => cambiarFiltro({ tipo: 'todos' })}>
                      Todos
                    </OpcionSelector>
                    <OpcionSelector active={filtros.tipo === 'ingreso'} onClick={() => cambiarFiltro({ tipo: 'ingreso' })}>
                      Ingresos
                    </OpcionSelector>
                    <OpcionSelector active={filtros.tipo === 'egreso'} onClick={() => cambiarFiltro({ tipo: 'egreso' })}>
                      Gastos
                    </OpcionSelector>
                  </SelectorVidrio>
                </div>
                <select
                  aria-label="Mes"
                  value={claveMesFiltro}
                  onChange={(e) => {
                    const elegido = mesesConDatos.find(([clave]) => clave === e.target.value);
                    cambiarFiltro({ mes: elegido ? elegido[1] : null });
                  }}
                  className="h-12 cursor-pointer rounded-2xl bg-black/[0.05] px-4 text-[15px] font-semibold focus-visible:outline-2 focus-visible:outline-primary dark:bg-white/[0.08]"
                >
                  <option value="">Todos los meses</option>
                  {mesesConDatos.map(([clave, fecha]) => (
                    <option key={clave} value={clave}>
                      {capitalizarPrimera(nombreMes(fecha))}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Orden"
                  value={filtros.orden}
                  onChange={(e) => cambiarFiltro({ orden: e.target.value === 'monto' ? 'monto' : 'fecha' })}
                  className="h-12 cursor-pointer rounded-2xl bg-black/[0.05] px-4 text-[15px] font-semibold focus-visible:outline-2 focus-visible:outline-primary dark:bg-white/[0.08]"
                >
                  <option value="fecha">Más recientes</option>
                  <option value="monto">Mayor monto</option>
                </select>
                <button
                  type="button"
                  onClick={() => h.setFiltrosAbierto(true)}
                  aria-label={h.filtrosActivos > 0 ? `Más filtros, ${h.filtrosActivos} activos` : 'Más filtros'}
                  className="relative flex h-12 items-center gap-2 rounded-2xl bg-black/[0.05] px-4 text-[15px] font-semibold transition-colors hover:bg-black/[0.08] focus-visible:outline-2 focus-visible:outline-primary dark:bg-white/[0.08] dark:hover:bg-white/[0.12]"
                >
                  <IconoFiltro className="size-5" />
                  Más filtros
                  {h.filtrosActivos > 0 && (
                    <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[12px] font-bold text-white" aria-hidden="true">
                      {h.filtrosActivos}
                    </span>
                  )}
                </button>
              </div>
              {h.filtrosActivos > 0 && (
                <div className="mt-3">
                  <ChipsFiltrosActivos
                    filtros={filtros}
                    setFiltros={setFiltros}
                    categoriaPorId={h.categoriaPorId}
                    quitarCategoria={h.quitarCategoria}
                    etiquetaMonto={h.etiquetaMonto}
                    envolver
                  />
                </div>
              )}
            </SuperficieVidrio>

            {/* Totales de lo que se está viendo */}
            <div className="mt-5" aria-live="polite">
              <Segmentos
                etiqueta="Totales de los movimientos que ves"
                items={[
                  { etiqueta: 'Movimientos', valor: String(h.transaccionesFiltradas.length) },
                  { etiqueta: 'Ingresos', valor: formatearMonto(ingresos), tono: 'ingreso' },
                  { etiqueta: 'Gastos', valor: formatearMonto(gastos), tono: 'intereses' },
                  { etiqueta: 'Neto', valor: formatearMontoConSigno(h.neto), tono: h.neto > 0 ? 'ingreso' : h.neto < 0 ? 'alerta' : 'normal' },
                ]}
              />
            </div>

            {h.transaccionesFiltradas.length === 0 ? (
              <div className="mt-5 flex flex-col items-start gap-3">
                <Aviso>Ningún movimiento coincide con esta búsqueda.</Aviso>
                <button type="button" onClick={() => setFiltros(FILTROS_INICIALES)} className="text-[15px] font-semibold text-primary">
                  Quitar búsqueda y filtros
                </button>
              </div>
            ) : (
              <SuperficieVidrio className="mt-5">
                <table className="w-full border-collapse text-[15px]">
                  <thead>
                    <tr className="text-left text-[12px] text-secundario">
                      <th scope="col" className="w-[110px] px-5 py-3 font-medium">
                        Fecha
                      </th>
                      <th scope="col" className="px-3 py-3 font-medium">
                        Movimiento
                      </th>
                      <th scope="col" className="px-3 py-3 font-medium">
                        Categoría
                      </th>
                      <th scope="col" className="px-5 py-3 text-right font-medium">
                        Monto
                      </th>
                    </tr>
                  </thead>
                  {h.grupos.map(({ clave, titulo, movimientos }) => {
                    const netoMes = resumirMes(movimientos, h.categoriaPorId).disponible;
                    return (
                      <tbody key={clave}>
                        <tr className="bg-black/[0.04] dark:bg-white/[0.06]">
                          <th scope="colgroup" colSpan={3} className="px-5 py-2.5 text-left text-[14px] font-semibold">
                            {titulo}
                          </th>
                          <td className={`px-5 py-2.5 text-right text-[14px] font-bold cifras ${COLOR_NETO(netoMes)}`}>{formatearMontoConSigno(netoMes)}</td>
                        </tr>
                        {movimientos.map((t) => {
                          const categoria = h.categoriaPorId(t.categoriaId);
                          const { nombre, emoji } = presentacionMovimiento(t, categoria);
                          const esIngreso = t.tipo === 'ingreso';
                          return (
                            <tr
                              key={t.id}
                              className="relative border-t border-black/[0.06] transition-colors hover:bg-black/[0.03] dark:border-white/10 dark:hover:bg-white/[0.05]"
                            >
                              <td className="px-5 py-2.5 whitespace-nowrap text-secundario cifras">{formatearFechaCorta(t.fecha)}</td>
                              <th scope="row" className="px-3 py-2.5 text-left font-medium">
                                <button
                                  type="button"
                                  onClick={() => h.abrirMovimiento(t)}
                                  aria-label={`${t.item}, ${esIngreso ? 'ingreso' : 'gasto'} de ${formatearMonto(t.monto)}. Editar`}
                                  className="flex w-full items-center gap-3 text-left after:absolute after:inset-0 after:content-[''] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary"
                                >
                                  <span
                                    className="flex size-9 shrink-0 items-center justify-center rounded-full text-[18px]"
                                    style={{ background: `color-mix(in srgb, ${colorCategoria(t.creditoId ?? t.prestamoId ?? t.categoriaId)} 24%, transparent)` }}
                                    aria-hidden="true"
                                  >
                                    {emoji}
                                  </span>
                                  <span className="truncate">{t.item}</span>
                                </button>
                              </th>
                              <td className="px-3 py-2.5 text-secundario">{nombre}</td>
                              <td className={`px-5 py-2.5 text-right font-semibold cifras ${esIngreso ? 'text-ingreso' : ''}`}>
                                {esIngreso ? '+' : '−'}
                                {formatearMonto(t.monto)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    );
                  })}
                </table>
              </SuperficieVidrio>
            )}
          </div>
        )}
      </div>

      <NuevoMovimientoSheet
        abierto={creando}
        categorias={h.categorias}
        mesSeleccionado={new Date()}
        onCerrar={() => setCreando(false)}
        onGuardar={crear}
        onCrearCategoria={h.crearCategoria}
      />
    </>
  );
}
