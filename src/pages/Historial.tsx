import { Badge, Block, BlockTitle, Link, List, Navbar, Page, Preloader, Searchbar } from 'konsta/react';
import { Cargando } from '../components/Cargando';
import { ChipsFiltrosActivos } from '../components/ChipsFiltrosActivos';
import { FilaMovimiento } from '../components/FilaMovimiento';
import { HistorialEscritorio } from '../components/HistorialEscritorio';
import { HistorialFiltrosSheet } from '../components/HistorialFiltrosSheet';
import { IconoDescargar, IconoFiltro } from '../components/Iconos';
import { NuevoMovimientoSheet } from '../components/NuevoMovimientoSheet';
import { useEsEscritorio } from '../components/useEsEscritorio';
import { useHistorial } from '../data/useHistorial';
import { resumirMes } from '../utils/contabilidad';
import { presentacionMovimiento } from '../utils/presentacionMovimiento';
import { formatearFechaCorta, formatearMontoConSigno } from '../utils/fechas';
import { FILTROS_INICIALES } from '../utils/filtrosHistorial';

export function Historial() {
  const h = useHistorial();
  const esEscritorio = useEsEscritorio();
  const { filtros, setFiltros, filtrosActivos, hayMovimientos, excel, cargando, transacciones, transaccionesFiltradas, grupos, neto, categoriaPorId } = h;

  return (
    <Page className="pagina-con-pestanas">
      {esEscritorio ? (
        <HistorialEscritorio datos={h} />
      ) : (
        <>
          <Navbar
            centerTitle
            title="Historial"
            right={
              hayMovimientos && (
                <>
                  <Link
                    iconOnly
                    onClick={excel.exportar}
                    aria-label={excel.exportando ? 'Generando Excel' : 'Exportar a Excel'}
                    aria-busy={excel.exportando}
                    className={excel.exportando ? 'pointer-events-none' : ''}
                  >
                    {excel.exportando ? <Preloader className="size-6" /> : <IconoDescargar className="size-7" />}
                  </Link>
                  <Link
                    iconOnly
                    onClick={() => h.setFiltrosAbierto(true)}
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

          {excel.error && (
            <Block className="my-3 text-[15px] text-alerta" role="alert">
              {excel.error}
            </Block>
          )}

          {filtrosActivos > 0 && (
            <ChipsFiltrosActivos
              filtros={filtros}
              setFiltros={setFiltros}
              categoriaPorId={categoriaPorId}
              quitarCategoria={h.quitarCategoria}
              etiquetaMonto={h.etiquetaMonto}
            />
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
              {grupos.map(({ clave, titulo: mes, movimientos: items }) => {
                const netoMes = resumirMes(items, categoriaPorId).disponible;
                return (
                  <section key={clave} aria-label={mes}>
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
                            onSeleccionar={h.abrirMovimiento}
                            detalle={`${presentacionMovimiento(t, categoria).nombre} · ${formatearFechaCorta(t.fecha)}`}
                          />
                        );
                      })}
                    </List>
                  </section>
                );
              })}
            </div>
          )}
        </>
      )}

      <NuevoMovimientoSheet
        abierto={h.editando !== null}
        categorias={h.categorias}
        transaccion={h.editando}
        mesSeleccionado={h.editando ? new Date(h.editando.fecha) : new Date()}
        onCerrar={() => h.setEditando(null)}
        onGuardar={h.manejarGuardar}
        onEliminar={h.manejarEliminar}
        onCrearCategoria={h.crearCategoria}
      />

      <HistorialFiltrosSheet
        abierto={h.filtrosAbierto}
        categorias={h.categorias}
        filtros={filtros}
        onCerrar={() => h.setFiltrosAbierto(false)}
        onAplicar={setFiltros}
      />
    </Page>
  );
}
