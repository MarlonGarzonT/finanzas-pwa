import { Block, BlockTitle, Navbar, Page } from 'konsta/react';
import { useMemo, useState } from 'react';
import { BalanceMes } from '../components/BalanceMes';
import { BarraFijoVariable } from '../components/BarraFijoVariable';
import { BrechaHistorica } from '../components/BrechaHistorica';
import { Cargando } from '../components/Cargando';
import { ComparacionMes } from '../components/ComparacionMes';
import { DonaCategorias } from '../components/DonaCategorias';
import { EncabezadoWeb } from '../components/EncabezadoWeb';
import { GraficoMensual } from '../components/GraficoMensual';
import { SelectorMes } from '../components/SelectorMes';
import { SelectorPeriodo } from '../components/SelectorPeriodo';
import { useMontajeDiferido } from '../components/useMontajeDiferido';
import { OpcionSelector, SelectorVidrio } from '../components/SelectorVidrio';
import { useFinanzas } from '../data/FinanzasContext';
import { useResumenMes } from '../data/useResumenMes';
import type { Tipo } from '../types';
import {
  compararConMesAnterior,
  desglosePorCategoria,
  evaluarMes,
  fijoVsVariable,
  ingresosEgresosPorMes,
  proyeccionFinDeMes,
} from '../utils/estadisticasMes';
import { capitalizarPrimera, nombreMes } from '../utils/fechas';
import { historialEnCache } from '../utils/historialAcumulado';
import { aniosConDatos } from '../utils/tablero';

const MESES_EN_GRAFICO = 6;

const TARJETA = 'rounded-3xl';

export function Reportes() {
  const { transacciones, categorias, gastosAnuales, cargando } = useFinanzas();
  // Lo principal (la brecha) se pinta primero; las tarjetas de más abajo se
  // montan un par de cuadros después, para que entrar a Reportes no se sienta lento.
  const resto = useMontajeDiferido();
  const [mesSeleccionado, setMesSeleccionado] = useState(() => new Date());
  const [tipoDona, setTipoDona] = useState<Tipo>('egreso');

  const { transaccionesDelMes, categoriaPorId, resumen: contable } = useResumenMes(mesSeleccionado);
  const resumen = useMemo(() => evaluarMes(contable), [contable]);
  // La ventana del gráfico termina en el mes actual y no se mueve al tocar una
  // columna (si se corriera, las columnas cambiarían bajo el dedo). Solo
  // salta si se elige un mes fuera de ella, más viejo o futuro.
  const ultimosMeses = useMemo(() => {
    const hoy = new Date();
    const mesesAtras =
      (hoy.getFullYear() - mesSeleccionado.getFullYear()) * 12 + (hoy.getMonth() - mesSeleccionado.getMonth());
    const dentroDeVentana = mesesAtras >= 0 && mesesAtras < MESES_EN_GRAFICO;
    return ingresosEgresosPorMes(transacciones, dentroDeVentana ? hoy : mesSeleccionado, MESES_EN_GRAFICO, categoriaPorId);
  }, [transacciones, mesSeleccionado, categoriaPorId]);
  const segmentosDona = useMemo(
    () => desglosePorCategoria(transaccionesDelMes, categoriaPorId, tipoDona),
    [transaccionesDelMes, categoriaPorId, tipoDona]
  );
  const totalDona = tipoDona === 'ingreso' ? contable.ingresos : contable.gastos;
  const fijoVariable = useMemo(() => fijoVsVariable(transaccionesDelMes, categoriaPorId), [transaccionesDelMes, categoriaPorId]);
  const comparacion = useMemo(
    () => compararConMesAnterior(transacciones, mesSeleccionado, categoriaPorId, new Date(), gastosAnuales),
    [transacciones, mesSeleccionado, categoriaPorId, gastosAnuales]
  );
  const historial = useMemo(() => historialEnCache(transacciones, categorias), [transacciones, categorias]);
  const proyeccion = contable.gastos > 0 ? proyeccionFinDeMes(transaccionesDelMes, categoriaPorId, mesSeleccionado) : null;
  const anios = useMemo(() => aniosConDatos(transacciones), [transacciones]);

  return (
    <Page className="pagina-con-pestanas">
      <Navbar className="lg:hidden" centerTitle title="Reportes" />
      <EncabezadoWeb
        titulo="Reportes"
        acciones={<SelectorPeriodo mes={mesSeleccionado} anios={anios} onCambiar={setMesSeleccionado} />}
      />

      {cargando ? (
        <Cargando />
      ) : transacciones.length === 0 ? (
        <Block className="text-center text-[17px] text-secundario">
          Cuando registres movimientos, aquí verás si gastas más de lo que entra, en qué gastas y cómo vas frente a los meses anteriores.
        </Block>
      ) : (
        // En escritorio es una cuadrícula de 12 columnas; en el celular, la misma
        // pila de siempre (el contenedor intermedio `lg:contents` deja que sus
        // hijos entren a la cuadrícula).
        <div className="columna-web lg:mx-auto lg:grid lg:max-w-[1480px] lg:grid-cols-12 lg:items-start lg:gap-x-6 lg:px-8">
          {/* Lo principal de Reportes: todo el historial, sin depender del mes
              elegido (por eso va fuera del bloque que se reinicia al cambiarlo). */}
          <div className="lg:col-span-7 lg:col-start-1 lg:row-span-2 lg:row-start-1">
            {historial.puntos.length > 0 && <BrechaHistorica historial={historial} />}
          </div>

          {/* La key reinicia las animaciones de los gráficos al cambiar de mes. */}
          {resto && (
            <div className="aparecer-suave lg:contents" key={mesSeleccionado.getTime()}>
              <div className="lg:col-span-5 lg:col-start-8 lg:row-start-1">
                <BlockTitle className="mt-6 lg:hidden">Mes a mes</BlockTitle>
                <div className="lg:hidden">
                  <SelectorMes mes={mesSeleccionado} onCambiar={setMesSeleccionado} />
                </div>

                <BalanceMes
                  resumen={resumen}
                  periodo={capitalizarPrimera(nombreMes(mesSeleccionado))}
                  cantidad={transaccionesDelMes.length}
                />
                <Block strong inset className="mt-3 mb-0 rounded-3xl p-4">
                  <ComparacionMes comparacion={comparacion} proyeccion={proyeccion} />
                </Block>
              </div>

              <div className="lg:col-span-6">
                <BlockTitle>Últimos {MESES_EN_GRAFICO} meses</BlockTitle>
                <Block strong inset className={TARJETA}>
                  <GraficoMensual datos={ultimosMeses} seleccionado={mesSeleccionado} onSeleccionar={setMesSeleccionado} />
                </Block>
              </div>

              <div className="lg:col-span-6">
                <BlockTitle>Por categoría</BlockTitle>
                <Block strong inset className={TARJETA}>
                  <SelectorVidrio className="mb-4">
                    <OpcionSelector active={tipoDona === 'egreso'} onClick={() => setTipoDona('egreso')}>
                      Gastos
                    </OpcionSelector>
                    <OpcionSelector active={tipoDona === 'ingreso'} onClick={() => setTipoDona('ingreso')}>
                      Ingresos
                    </OpcionSelector>
                  </SelectorVidrio>
                  <DonaCategorias key={tipoDona} segmentos={segmentosDona} total={totalDona} />
                </Block>
              </div>

              {/* En escritorio sube junto al balance del mes: así la columna del mes
                  llega a la misma altura que la brecha y no queda un hueco debajo. */}
              <div className="lg:col-span-5 lg:col-start-8 lg:row-start-2">
                <BlockTitle>Fijo vs. variable</BlockTitle>
                <Block strong inset className={TARJETA}>
                  <BarraFijoVariable {...fijoVariable} />
                </Block>
              </div>
            </div>
          )}
        </div>
      )}
    </Page>
  );
}
