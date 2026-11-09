import { Block, BlockTitle, Button, List, ListItem } from 'konsta/react';
import { useState } from 'react';
import { useFinanzas } from '../data/FinanzasContext';
import { useGastosAnuales, type GastoAnualConEstado } from '../data/useGastosAnuales';
import type { GastoAnual } from '../types';
import { formatearMonto, nombreMesDelAnio } from '../utils/fechas';
import { ChipOpcion } from './ChipOpcion';
import { EditarGastoAnualSheet } from './EditarGastoAnualSheet';
import { HojaInferior } from './HojaInferior';

interface Props {
  abierto: boolean;
  onCerrar: () => void;
}

// Los que más golpean el bolsillo en Colombia. Solo el nombre: el monto
// depende de cada quien y nunca se inventa.
const SUGERENCIAS = [
  'SOAT',
  'Impuesto vehicular',
  'Predial',
  'Matrícula',
  'Útiles escolares',
  'Fiestas de diciembre',
  'Seguro',
];

// Edición en curso: un gasto existente o uno nuevo (con o sin sugerencia).
type Edicion = { gasto: GastoAnual } | { nombreInicial: string } | null;

function detalle(g: GastoAnualConEstado): string {
  if (!g.activo) return `Vence en ${nombreMesDelAnio(g.mesVencimiento)} · En pausa`;
  if (g.pagadoEsteMes) return 'Vence este mes · Ya lo pagaste';
  if (g.vencePronto) return 'Vence este mes';
  return `Vence en ${nombreMesDelAnio(g.mesVencimiento)} · separa ${formatearMonto(g.cuotaMensual)} al mes`;
}

export function GastosAnualesSheet({ abierto, onCerrar }: Props) {
  const { categorias } = useFinanzas();
  const { gastos, costoMensual, crear, actualizar, eliminar } = useGastosAnuales();
  const [edicion, setEdicion] = useState<Edicion>(null);

  const categoriasDeGasto = categorias.filter((c) => c.tipo === 'egreso');
  const nombresUsados = new Set(gastos.map((g) => g.nombre.trim().toLowerCase()));
  const sugerencias = SUGERENCIAS.filter((s) => !nombresUsados.has(s.toLowerCase()));
  const gastoEditado = edicion && 'gasto' in edicion ? edicion.gasto : null;

  return (
    <>
      <HojaInferior abierto={abierto} titulo="Gastos del año" onCerrar={onCerrar} textoCerrar="Cerrar">
        {gastos.length > 0 ? (
          <>
            <Block className="mt-2 mb-0 text-[17px] leading-snug">
              Tus gastos del año te cuestan <span className="font-semibold cifras">{formatearMonto(costoMensual)}</span> al
              mes.
            </Block>
            <List strong inset dividers className="mt-4">
              {gastos.map((g) => (
                <ListItem
                  key={g.id}
                  link
                  linkComponent="button"
                  linkProps={{ type: 'button', 'aria-label': `Editar ${g.nombre}` }}
                  onClick={() => setEdicion({ gasto: g })}
                  title={g.nombre}
                  text={detalle(g)}
                  after={<span className="cifras">{formatearMonto(g.montoEstimado)}</span>}
                  contentClassName="w-full text-left"
                />
              ))}
            </List>
          </>
        ) : (
          <Block className="mt-2 mb-0 text-[17px] leading-snug">
            Anota lo que pagas una vez al año para repartirlo mes a mes y que no te tome por sorpresa.
          </Block>
        )}

        {sugerencias.length > 0 && (
          <>
            <BlockTitle>Sugerencias</BlockTitle>
            <div className="flex flex-wrap gap-2 px-4">
              {sugerencias.map((s) => (
                <ChipOpcion key={s} activo={false} onClick={() => setEdicion({ nombreInicial: s })}>
                  {s}
                </ChipOpcion>
              ))}
            </div>
          </>
        )}

        <div className="px-4 pt-6">
          <Button large rounded tonal onClick={() => setEdicion({ nombreInicial: '' })}>
            Agregar gasto del año
          </Button>
        </div>
        <p className="m-0 px-4 pt-3 text-center text-[13px] leading-snug text-secundario">
          El monto es tu cálculo: actualízalo cuando sepas el valor real.
        </p>
        <div className="pie-seguro" />
      </HojaInferior>

      <EditarGastoAnualSheet
        abierto={edicion !== null}
        gasto={gastoEditado}
        nombreInicial={edicion && 'nombreInicial' in edicion ? edicion.nombreInicial : ''}
        categoriasDeGasto={categoriasDeGasto}
        onCerrar={() => setEdicion(null)}
        onGuardar={(datos) => (gastoEditado ? actualizar(gastoEditado.id, datos) : crear(datos))}
        onEliminar={gastoEditado ? () => eliminar(gastoEditado.id) : undefined}
      />
    </>
  );
}
