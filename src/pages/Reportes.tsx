import { Block, BlockTitle, Navbar, Page } from 'konsta/react';
import { useMemo, useState } from 'react';
import { BalanceMes } from '../components/BalanceMes';
import { BarraFijoVariable } from '../components/BarraFijoVariable';
import { BrechaHistorica } from '../components/BrechaHistorica';
import { Cargando } from '../components/Cargando';
import { ComparacionMes } from '../components/ComparacionMes';
import { DonaCategorias } from '../components/DonaCategorias';
import { GraficoMensual } from '../components/GraficoMensual';
import { SelectorMes } from '../components/SelectorMes';
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
import { historialAcumulado } from '../utils/historialAcumulado';

const MESES_EN_GRAFICO = 6;

const TARJETA = 'rounded-3xl';

export function Reportes() {
  const { transacciones, gastosAnuales, cargando } = useFinanzas();
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
  const historial = useMemo(() => historialAcumulado(transacciones, categoriaPorId), [transacciones, categoriaPorId]);
  const proyeccion = contable.gastos > 0 ? proyeccionFinDeMes(transaccionesDelMes, categoriaPorId, mesSeleccionado) : null;

  return (
    <Page className="pagina-con-pestanas">
      <Navbar centerTitle title="Reportes" />

      {cargando ? (
        <Cargando />
      ) : transacciones.length === 0 ? (
        <Block className="text-center text-[17px] text-secundario">
          Cuando registres movimientos, aquí verás si gastas más de lo que entra, en qué gastas y cómo vas frente a los meses anteriores.
        </Block>
      ) : (
        <>
        {/* La key reinicia las animaciones de los gráficos al cambiar de mes. */}
        <div className="aparecer-suave" key={mesSeleccionado.getTime()}>
          <SelectorMes mes={mesSeleccionado} onCambiar={setMesSeleccionado} />

          <BalanceMes
            resumen={resumen}
            periodo={capitalizarPrimera(nombreMes(mesSeleccionado))}
            cantidad={transaccionesDelMes.length}
          />
          <Block strong inset className="mt-3 mb-0 rounded-3xl p-4">
            <ComparacionMes comparacion={comparacion} proyeccion={proyeccion} />
          </Block>

          <BlockTitle>Últimos {MESES_EN_GRAFICO} meses</BlockTitle>
          <Block strong inset className={TARJETA}>
            <GraficoMensual datos={ultimosMeses} seleccionado={mesSeleccionado} onSeleccionar={setMesSeleccionado} />
          </Block>

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

          <BlockTitle>Fijo vs. variable</BlockTitle>
          <Block strong inset className={TARJETA}>
            <BarraFijoVariable {...fijoVariable} />
          </Block>
        </div>

        {/* Todo el historial: no depende del mes elegido, por eso va fuera
            del bloque que se reinicia al cambiar de mes. */}
        {historial.puntos.length > 0 && (
          <>
            <BlockTitle>Desde que empezaste</BlockTitle>
            <BrechaHistorica historial={historial} />
          </>
        )}
        </>
      )}
    </Page>
  );
}
