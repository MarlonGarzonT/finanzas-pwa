import { Badge, Block, BlockTitle, Link, List, Navbar, Page, Preloader, Searchbar } from 'konsta/react';
import { useMemo, useState } from 'react';
import { Cargando } from '../components/Cargando';
import { ChipOpcion } from '../components/ChipOpcion';
import { FilaMovimiento } from '../components/FilaMovimiento';
import { HistorialFiltrosSheet } from '../components/HistorialFiltrosSheet';
import { IconoDescargar, IconoFiltro } from '../components/Iconos';
import { NuevoMovimientoSheet } from '../components/NuevoMovimientoSheet';
import { useFinanzas } from '../data/FinanzasContext';
import type { NuevaTransaccion, Transaccion } from '../types';
import { resumirMovimientos } from '../utils/estadisticasMes';
import { exportarTransaccionesExcel } from '../utils/exportarExcel';
import {
  capitalizarPrimera,
  fechaEnMesSeleccionado,
  formatearFechaCorta,
  formatearMonto,
  formatearMontoConSigno,
  nombreMes,
} from '../utils/fechas';
import {
  aplicarFiltros,
  contarFiltrosActivos,
  FILTROS_INICIALES,
  type FiltrosHistorial,
} from '../utils/filtrosHistorial';

export function Historial() {
  const { transacciones, categorias, cargando, actualizarMovimiento, eliminarMovimiento, crearCategoria } = useFinanzas();
  const [editando, setEditando] = useState<Transaccion | null>(null);
  const [filtros, setFiltros] = useState<FiltrosHistorial>(FILTROS_INICIALES);
  const [filtrosAbierto, setFiltrosAbierto] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [errorExportar, setErrorExportar] = useState<string | null>(null);

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
      const clave = capitalizarPrimera(nombreMes(new Date(t.fecha)));
      if (!mapa.has(clave)) mapa.set(clave, []);
      mapa.get(clave)!.push(t);
    }
    if (filtros.orden === 'monto') {
      for (const items of mapa.values()) items.sort((a, b) => b.monto - a.monto);
    }
    return Array.from(mapa.entries());
  }, [transaccionesFiltradas, filtros.orden]);

  const neto = useMemo(() => resumirMovimientos(transaccionesFiltradas).neto, [transaccionesFiltradas]);

  const filtrosActivos = contarFiltrosActivos(filtros);
  const hayMovimientos = !cargando && transacciones.length > 0;

  function quitarCategoria(id: string) {
    setFiltros((prev) => {
      const copia = new Set(prev.categoriaIds);
      copia.delete(id);
      return { ...prev, categoriaIds: copia };
    });
  }

  // Exporta todo el historial (no solo lo filtrado) a un .xlsx; ExcelJS se
  // carga recién aquí, en su propio chunk.
  async function manejarExportar() {
    setExportando(true);
    setErrorExportar(null);
    try {
      await exportarTransaccionesExcel(transacciones, categoriaPorId);
    } catch {
      setErrorExportar('No se pudo generar el Excel. Revisa tu conexión e intenta de nuevo.');
    } finally {
      setExportando(false);
    }
  }

  async function manejarGuardar({ mes, ...datos }: NuevaTransaccion & { mes: Date }) {
    if (!editando) return;
    await actualizarMovimiento(editando.id, datos, fechaEnMesSeleccionado(mes, new Date(editando.fecha)));
    setEditando(null);
  }

  async function manejarEliminar() {
    if (!editando) return;
    await eliminarMovimiento(editando.id);
    setEditando(null);
  }

  const etiquetaMonto =
    filtros.montoMin !== null && filtros.montoMax !== null
      ? `${formatearMonto(filtros.montoMin)} – ${formatearMonto(filtros.montoMax)}`
      : filtros.montoMin !== null
        ? `Desde ${formatearMonto(filtros.montoMin)}`
        : filtros.montoMax !== null
          ? `Hasta ${formatearMonto(filtros.montoMax)}`
          : null;

  return (
    <Page className="pagina-con-pestanas">
      <Navbar
        centerTitle
        title="Historial"
        right={
          hayMovimientos && (
            <>
              <Link
                iconOnly
                onClick={manejarExportar}
                aria-label={exportando ? 'Generando Excel' : 'Exportar a Excel'}
                aria-busy={exportando}
                className={exportando ? 'pointer-events-none' : ''}
              >
                {exportando ? <Preloader className="size-6" /> : <IconoDescargar className="size-7" />}
              </Link>
              <Link
                iconOnly
                onClick={() => setFiltrosAbierto(true)}
                aria-label={filtrosActivos > 0 ? `Filtros, ${filtrosActivos} activos` : 'Filtros'}
                className="relative"
              >
                <IconoFiltro className="size-7" />
                {filtrosActivos > 0 && (
                  <Badge small className="absolute -top-0.5 -right-1" aria-hidden="true">
                    {filtrosActivos}
                  </Badge>
                )}
              </Link>
            </>
          )
        }
        subnavbar={
          hayMovimientos && (
            <Searchbar
              value={filtros.texto}
              placeholder="Buscar movimiento"
              onInput={(e: React.ChangeEvent<HTMLInputElement>) => setFiltros((prev) => ({ ...prev, texto: e.target.value }))}
              onClear={() => setFiltros((prev) => ({ ...prev, texto: '' }))}
              clearButton
              disableButton={false}
            />
          )
        }
      />

      {errorExportar && (
        <Block className="my-3 text-[15px] text-alerta" role="alert">
          {errorExportar}
        </Block>
      )}

      {filtrosActivos > 0 && (
        <div className="flex gap-2 overflow-x-auto px-4 pt-3 pb-1 [scrollbar-width:none]" role="group" aria-label="Filtros activos">
          {Array.from(filtros.categoriaIds).map((id) => {
            const cat = categoriaPorId(id);
            return (
              <ChipOpcion key={id} activo onClick={() => quitarCategoria(id)} onQuitar={() => quitarCategoria(id)}>
                {cat?.emoji} {cat?.nombre ?? 'Categoría'}
              </ChipOpcion>
            );
          })}
          {filtros.tipo !== 'todos' && (
            <ChipOpcion
              activo
              onClick={() => setFiltros((prev) => ({ ...prev, tipo: 'todos' }))}
              onQuitar={() => setFiltros((prev) => ({ ...prev, tipo: 'todos' }))}
            >
              {filtros.tipo === 'ingreso' ? 'Ingresos' : 'Gastos'}
            </ChipOpcion>
          )}
          {filtros.soloFijos && (
            <ChipOpcion
              activo
              onClick={() => setFiltros((prev) => ({ ...prev, soloFijos: false }))}
              onQuitar={() => setFiltros((prev) => ({ ...prev, soloFijos: false }))}
            >
              Solo fijos
            </ChipOpcion>
          )}
          {etiquetaMonto && (
            <ChipOpcion
              activo
              onClick={() => setFiltros((prev) => ({ ...prev, montoMin: null, montoMax: null }))}
              onQuitar={() => setFiltros((prev) => ({ ...prev, montoMin: null, montoMax: null }))}
            >
              {etiquetaMonto}
            </ChipOpcion>
          )}
          {filtros.mes && (
            <ChipOpcion
              activo
              onClick={() => setFiltros((prev) => ({ ...prev, mes: null }))}
              onQuitar={() => setFiltros((prev) => ({ ...prev, mes: null }))}
            >
              {capitalizarPrimera(nombreMes(filtros.mes))}
            </ChipOpcion>
          )}
          <ChipOpcion activo={false} onClick={() => setFiltros(FILTROS_INICIALES)}>
            Limpiar todo
          </ChipOpcion>
        </div>
      )}

      {cargando ? (
        <Cargando />
      ) : transacciones.length === 0 ? (
        <Block className="text-center text-[17px] text-secundario">
          Aún no tienes movimientos. Regístralos desde Resumen con el botón +.
        </Block>
      ) : transaccionesFiltradas.length === 0 ? (
        <Block className="flex flex-col items-center gap-3 text-center">
          <p className="m-0 text-[17px] text-secundario">Ningún movimiento coincide con esta búsqueda.</p>
          <Link onClick={() => setFiltros(FILTROS_INICIALES)}>Quitar búsqueda y filtros</Link>
        </Block>
      ) : (
        <div className="aparecer-suave">
          {/* El balance a fondo (barras, estado, meses) vive en Reportes; aquí
              basta el total de lo que se está viendo. */}
          <p className="mx-4 mt-3 mb-0 text-[15px] text-secundario cifras" aria-live="polite">
            {transaccionesFiltradas.length} movimiento{transaccionesFiltradas.length === 1 ? '' : 's'} ·{' '}
            <span className={`font-semibold ${neto > 0 ? 'text-ingreso' : neto < 0 ? 'text-alerta' : ''}`}>
              {formatearMontoConSigno(neto)}
            </span>
          </p>
          {grupos.map(([mes, items]) => {
            const netoMes = items.reduce((acc, t) => acc + (t.tipo === 'ingreso' ? t.monto : -t.monto), 0);
            return (
              <section key={mes} aria-label={mes}>
                {/* Cada mes trae su balance a la derecha: al bajar se notan los meses en rojo. */}
                <BlockTitle>
                  <span>{mes}</span>
                  <span
                    className={`text-[15px] font-semibold cifras ${
                      netoMes > 0 ? 'text-ingreso' : netoMes < 0 ? 'text-alerta' : 'text-secundario'
                    }`}
                  >
                    {formatearMontoConSigno(netoMes)}
                  </span>
                </BlockTitle>
                <List strong inset dividers>
                  {items.map((t) => {
                    const categoria = categoriaPorId(t.categoriaId);
                    return (
                      <FilaMovimiento
                        key={t.id}
                        transaccion={t}
                        categoria={categoria}
                        onSeleccionar={setEditando}
                        detalle={`${categoria?.nombre ?? 'Otros'} · ${formatearFechaCorta(t.fecha)} · Sem. ${t.semanaDelMes}`}
                      />
                    );
                  })}
                </List>
              </section>
            );
          })}
        </div>
      )}

      <NuevoMovimientoSheet
        abierto={editando !== null}
        categorias={categorias}
        transaccion={editando}
        mesSeleccionado={editando ? new Date(editando.fecha) : new Date()}
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
    </Page>
  );
}
