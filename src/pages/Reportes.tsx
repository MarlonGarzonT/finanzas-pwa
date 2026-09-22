import { useMemo, useState } from 'react';
import { AnilloAhorro } from '../components/AnilloAhorro';
import { BarraFijoVariable } from '../components/BarraFijoVariable';
import { ComparacionMes } from '../components/ComparacionMes';
import { DonaCategorias } from '../components/DonaCategorias';
import { GraficoSemanal } from '../components/GraficoSemanal';
import { SelectorMes } from '../components/SelectorMes';
import { SelectorPagina } from '../components/SelectorPagina';
import { Spinner } from '../components/Spinner';
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
import './Reportes.css';

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
    <div className="reportes">
      <header className="reportes__header">
        <SelectorPagina />
      </header>

      {cargando ? (
        <div className="reportes__cargando">
          <Spinner />
        </div>
      ) : transacciones.length === 0 ? (
        <p className="reportes__vacio">Aún no tienes movimientos para generar un reporte.</p>
      ) : (
        <div className="reportes__contenido" key={mesSeleccionado.getTime()}>
          <SelectorMes mes={mesSeleccionado} onCambiar={setMesSeleccionado} />

          <div className="reportes__grid-superior">
            <div className="grafico-card reportes__tarjeta-anillo">
              <AnilloAhorro tasa={ahorro} />
            </div>
            <div className="grafico-card reportes__tarjeta-comparacion">
              <ComparacionMes comparacion={comparacion} proyeccion={proyeccion} />
            </div>
          </div>

          <section className="grafico-card">
            <div className="reportes__titulo-con-toggle">
              <h3 className="grafico-card__titulo">Por categoría</h3>
              <div className="reportes__toggle">
                <button
                  type="button"
                  className={`reportes__toggle-btn ${tipoDona === 'egreso' ? 'reportes__toggle-btn--activo' : ''}`}
                  onClick={() => setTipoDona('egreso')}
                >
                  Gastos
                </button>
                <button
                  type="button"
                  className={`reportes__toggle-btn ${tipoDona === 'ingreso' ? 'reportes__toggle-btn--activo' : ''}`}
                  onClick={() => setTipoDona('ingreso')}
                >
                  Ingresos
                </button>
              </div>
            </div>
            <DonaCategorias segmentos={segmentosDona} total={totalDona} />
          </section>

          <section className="grafico-card">
            <h3 className="grafico-card__titulo">Fijo vs. variable</h3>
            <BarraFijoVariable {...fijoVariable} />
          </section>

          <section className="grafico-card">
            <h3 className="grafico-card__titulo">Gasto por semana</h3>
            <GraficoSemanal datos={semanal} />
          </section>
        </div>
      )}
    </div>
  );
}
