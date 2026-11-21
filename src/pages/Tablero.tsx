import { Page } from 'konsta/react';
import { useMemo, useState } from 'react';
import { BotonPrincipal } from '../components/BotonPrincipal';
import { Cargando } from '../components/Cargando';
import { DonaAhorroTablero } from '../components/DonaAhorroTablero';
import { CORAL, GraficoComparativo, GraficoMensual, VERDE } from '../components/GraficosTablero';
import { NuevoMovimientoSheet } from '../components/NuevoMovimientoSheet';
import { ListaMayoresGastos } from '../components/ListaMayoresGastos';
import { PanelTablero } from '../components/PanelTablero';
import { SaldosTablero } from '../components/SaldosTablero';
import { Aviso, Segmentos } from '../components/Segmentos';
import { SelectorPeriodo } from '../components/SelectorPeriodo';
import { TablaCategoriasTablero } from '../components/TablaCategoriasTablero';
import { useFinanzas } from '../data/FinanzasContext';
import { useTablero } from '../data/useTablero';
import type { NuevaTransaccion } from '../types';
import { fechaConHora, formatearMonto } from '../utils/fechas';
import { aniosConDatos } from '../utils/tablero';

function primerDiaDelMes(fecha: Date): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth(), 1);
}

// El tablero de escritorio (desde 1024 px), pensado como el tablero de Excel de
// finanzas personales: periodo arriba, saldos a la izquierda, ingresos y gastos
// por categoría contra su promedio al centro con su gráfica al lado, el reparto
// de lo que entró y, abajo, los doce meses. Los datos y las reglas son los de
// siempre; lo único nuevo es cómo se acomodan para verlos todos a la vez.
export function Tablero() {
  const { transacciones, categorias, crearMovimiento, crearCategoria } = useFinanzas();
  const [mes, setMes] = useState(() => primerDiaDelMes(new Date()));
  const [creando, setCreando] = useState(false);
  const datos = useTablero(mes);
  const anios = useMemo(() => aniosConDatos(transacciones), [transacciones]);

  async function guardar({ dia, ...resto }: NuevaTransaccion & { dia: string }) {
    await crearMovimiento(resto, fechaConHora(dia, new Date()));
    setCreando(false);
  }

  const promedioIngresos = datos.serie.reduce((acc, p) => acc + p.ingresos, 0) / datos.serie.length;
  const promedioGastos = datos.serie.reduce((acc, p) => acc + p.gastos, 0) / datos.serie.length;

  return (
    <Page className="pagina-con-pestanas">
      <div className="mx-auto w-full max-w-[1480px] px-8 pt-8">
        <header className="flex flex-wrap items-end justify-between gap-6">
          <h1 className="m-0 text-[36px] leading-none font-bold tracking-[-0.03em]">Tablero</h1>
          <div className="flex items-center gap-4">
            <SelectorPeriodo mes={mes} anios={anios} onCambiar={setMes} />
            <div className="w-[230px]">
              <BotonPrincipal texto="Nuevo movimiento" onClick={() => setCreando(true)} efectos={false} />
            </div>
          </div>
        </header>

        {datos.cargando ? (
          <Cargando />
        ) : (
          <div className="mt-6 grid grid-cols-12 items-stretch gap-5">
            {!datos.hayMovimientos && (
              <div className="col-span-12">
                <Aviso>Aún no registras movimientos. Toca "Nuevo movimiento" y el tablero se llena solo.</Aviso>
              </div>
            )}

            {/* Izquierda: lo que tienes y cómo se repartió lo que entró. */}
            <div className="col-span-12 flex flex-col gap-5 min-[1400px]:col-span-3">
              <SaldosTablero datos={datos} />
              <PanelTablero titulo="Lo que te quedó" retraso={260} className="flex-1">
                <DonaAhorroTablero reparto={datos.reparto} />
              </PanelTablero>
            </div>

            {/* Centro: las dos tablas por categoría contra su promedio. */}
            <div className="col-span-12 flex flex-col gap-5 lg:col-span-6 min-[1400px]:col-span-5">
              <PanelTablero
                titulo="Ingresos por categoría"
                ficha={{ etiqueta: 'Total', valor: formatearMonto(datos.ingresos.total), tono: 'ingreso' }}
                retraso={120}
              >
                <TablaCategoriasTablero tabla={datos.ingresos} subirEsBueno vacio="No hay ingresos en este periodo." />
              </PanelTablero>
              <PanelTablero
                titulo="Gastos por categoría"
                ficha={{ etiqueta: 'Total', valor: formatearMonto(datos.gastos.total), tono: 'intereses' }}
                retraso={240}
              >
                <TablaCategoriasTablero tabla={datos.gastos} subirEsBueno={false} vacio="No hay gastos en este periodo." />
              </PanelTablero>
              <PanelTablero titulo="Lo que más pesó" retraso={360} className="flex-1">
                <ListaMayoresGastos gastos={datos.mayoresGastos} />
              </PanelTablero>
            </div>

            {/* Derecha: las mismas dos tablas, en barras. */}
            <div className="col-span-12 flex flex-col gap-5 lg:col-span-6 min-[1400px]:col-span-4">
              <PanelTablero titulo="Ingresos contra el promedio" retraso={200}>
                <GraficoComparativo filas={datos.ingresos.filas} colorTotal={VERDE} etiquetaTotal="Este mes" />
              </PanelTablero>
              <PanelTablero titulo="Gastos contra el promedio" retraso={320} className="flex-1">
                <GraficoComparativo filas={datos.gastos.filas} colorTotal={CORAL} etiquetaTotal="Este mes" />
              </PanelTablero>
            </div>

            <PanelTablero titulo="Tus últimos doce meses" retraso={400} className="col-span-12">
              <div className="mb-4">
                <Segmentos
                  etiqueta="Promedio mensual de los últimos doce meses"
                  items={[
                    { etiqueta: 'Ingresos al mes', valor: formatearMonto(Math.round(promedioIngresos)), tono: 'ingreso' },
                    { etiqueta: 'Gastos al mes', valor: formatearMonto(Math.round(promedioGastos)), tono: 'intereses' },
                    { etiqueta: 'Te quedan al mes', valor: formatearMonto(Math.round(promedioIngresos - promedioGastos)) },
                  ]}
                />
              </div>
              <GraficoMensual serie={datos.serie} />
            </PanelTablero>
          </div>
        )}
      </div>

      <NuevoMovimientoSheet
        abierto={creando}
        categorias={categorias}
        mesSeleccionado={mes}
        onCerrar={() => setCreando(false)}
        onGuardar={guardar}
        onCrearCategoria={crearCategoria}
      />
    </Page>
  );
}
