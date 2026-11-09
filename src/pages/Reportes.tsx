import { Block, BlockTitle, Navbar, Page } from 'konsta/react';
import { useMemo, useState } from 'react';
import { OpcionSelector, SelectorVidrio } from '../components/SelectorVidrio';
import { AnilloAhorro } from '../components/AnilloAhorro';
import { BarraFijoVariable } from '../components/BarraFijoVariable';
import { Cargando } from '../components/Cargando';
import { ComparacionMes } from '../components/ComparacionMes';
import { DonaCategorias } from '../components/DonaCategorias';
import { GraficoSemanal } from '../components/GraficoSemanal';
import { SelectorMes } from '../components/SelectorMes';
import { useFinanzas } from '../data/FinanzasContext';
import type { Tipo } from '../types';
import {
  compararConMesAnterior,
  desglosePorCategoria,
  esMesActual,
  fijoVsVariable,
  gastoPorSemana,
  proyeccionFinDeMes,
  tasaAhorro,
} from '../utils/estadisticasMes';
import { claveMes, claveMesDeFecha } from '../utils/fechas';

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

  const { totalIngresos, totalEgresos } = useMemo(() => {
    let ingresos = 0;
    let egresos = 0;
    for (const t of transaccionesDelMes) {
      if (t.tipo === 'ingreso') ingresos += t.monto;
      else egresos += t.monto;
    }
    return { totalIngresos: ingresos, totalEgresos: egresos };
  }, [transaccionesDelMes]);

  const ahorro = tasaAhorro(totalIngresos, totalEgresos);
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
    <Page className="pb-[calc(var(--k-safe-area-bottom)+112px)]">
      <Navbar centerTitle title="Reportes" />

      {cargando ? (
        <Cargando />
      ) : transacciones.length === 0 ? (
        <Block className="text-center text-[17px] text-secundario">
          Cuando registres movimientos, aquí verás tu ahorro, en qué gastas y cómo vas frente al mes pasado.
        </Block>
      ) : (
        // La key reinicia las animaciones de los gráficos al cambiar de mes.
        <div className="aparecer-suave" key={mesSeleccionado.getTime()}>
          <SelectorMes mes={mesSeleccionado} onCambiar={setMesSeleccionado} />

          <div className="mt-4 grid grid-cols-2 gap-3 px-4">
            <Block strong className="m-0 flex items-center justify-center rounded-3xl px-2 py-4">
              <AnilloAhorro tasa={ahorro} />
            </Block>
            <Block strong className="m-0 flex flex-col justify-center rounded-3xl px-2 py-3">
              <ComparacionMes comparacion={comparacion} proyeccion={proyeccion} />
            </Block>
          </div>

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
