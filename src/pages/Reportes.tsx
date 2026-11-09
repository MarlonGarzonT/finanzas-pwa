import { Block, BlockTitle, Navbar, Page } from 'konsta/react';
import { useMemo, useState } from 'react';
import { BalanceMes } from '../components/BalanceMes';
import { BarraFijoVariable } from '../components/BarraFijoVariable';
import { Cargando } from '../components/Cargando';
import { ComparacionMes } from '../components/ComparacionMes';
import { DonaCategorias } from '../components/DonaCategorias';
import { GraficoMensual } from '../components/GraficoMensual';
import { GraficoSemanal } from '../components/GraficoSemanal';
import { SelectorMes } from '../components/SelectorMes';
import { OpcionSelector, SelectorVidrio } from '../components/SelectorVidrio';
import { useFinanzas } from '../data/FinanzasContext';
import type { Tipo } from '../types';
import {
  compararConMesAnterior,
  desglosePorCategoria,
  esMesActual,
  fijoVsVariable,
  gastoPorSemana,
  ingresosEgresosPorMes,
  proyeccionFinDeMes,
  resumirMovimientos,
} from '../utils/estadisticasMes';
import { capitalizarPrimera, claveMes, claveMesDeFecha, nombreMes } from '../utils/fechas';

const MESES_EN_GRAFICO = 6;

const TARJETA = 'rounded-3xl';

export function Reportes() {
  const { transacciones, categorias, cargando } = useFinanzas();
  const [mesSeleccionado, setMesSeleccionado] = useState(() => new Date());
  const [tipoDona, setTipoDona] = useState<Tipo>('egreso');

  const categoriaPorId = useMemo(() => {
    const mapa = new Map(categorias.map((c) => [c.id, c]));
    return (id: string) => mapa.get(id);
  }, [categorias]);

  const transaccionesDelMes = useMemo(() => {
    const clave = claveMesDeFecha(mesSeleccionado);
    return transacciones.filter((t) => claveMes(t.fecha) === clave);
  }, [transacciones, mesSeleccionado]);

  const resumen = useMemo(() => resumirMovimientos(transaccionesDelMes), [transaccionesDelMes]);
  const { ingresos: totalIngresos, egresos: totalEgresos } = resumen;
  // La ventana del gráfico termina en el mes actual y no se mueve al tocar una
  // columna (si se corriera, las columnas cambiarían bajo el dedo). Solo
  // salta si se elige un mes fuera de ella, más viejo o futuro.
  const ultimosMeses = useMemo(() => {
    const hoy = new Date();
    const mesesAtras =
      (hoy.getFullYear() - mesSeleccionado.getFullYear()) * 12 + (hoy.getMonth() - mesSeleccionado.getMonth());
    const dentroDeVentana = mesesAtras >= 0 && mesesAtras < MESES_EN_GRAFICO;
    return ingresosEgresosPorMes(transacciones, dentroDeVentana ? hoy : mesSeleccionado, MESES_EN_GRAFICO);
  }, [transacciones, mesSeleccionado]);
  const segmentosDona = useMemo(
    () => desglosePorCategoria(transaccionesDelMes, categoriaPorId, tipoDona),
    [transaccionesDelMes, categoriaPorId, tipoDona]
  );
  const totalDona = tipoDona === 'ingreso' ? totalIngresos : totalEgresos;
  const fijoVariable = useMemo(() => fijoVsVariable(transaccionesDelMes, categoriaPorId), [transaccionesDelMes, categoriaPorId]);
  const semanal = useMemo(() => gastoPorSemana(transaccionesDelMes), [transaccionesDelMes]);
  const comparacion = useMemo(() => compararConMesAnterior(transacciones, mesSeleccionado), [transacciones, mesSeleccionado]);
  const proyeccion = esMesActual(mesSeleccionado) && totalEgresos > 0 ? proyeccionFinDeMes(totalEgresos, mesSeleccionado) : null;

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
        // La key reinicia las animaciones de los gráficos al cambiar de mes.
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

          <BlockTitle>Gasto por semana</BlockTitle>
          <Block strong inset className={TARJETA}>
            <GraficoSemanal datos={semanal} />
          </Block>
        </div>
      )}
    </Page>
  );
}
