import { BlockHeader } from 'konsta/react';
import type { ResumenCreditos } from '../utils/creditos';
import { formatearMonto } from '../utils/fechas';
import { BarraReparto } from './BarraReparto';
import { FondoVidrio } from './FondoVidrio';
import { MontoAnimado } from './MontoAnimado';
import BorderGlow from './reactbits/BorderGlow';
import { useMontajeDiferido } from './useMontajeDiferido';

interface Props {
  resumen: ResumenCreditos;
}

const CORAL = '#ff7080';

// Mismas fichas de luz de la tarjeta de la brecha (Reportes): coral para lo
// que ya se fue en intereses y azul pizarra para lo que todavía falta.
const FICHAS = {
  pagados: { glow: '352 100 72', colores: [CORAL, '#ff9aa5', '#f2495c'], fondo: '#2e1820', texto: '#ff8c99' },
  porPagar: { glow: '222 80 66', colores: ['#6c8cff', '#9db4ff', '#3f5bd6'], fondo: '#121a33', texto: '#a9c0ff' },
};

function Ficha({ tipo, etiqueta, monto }: { tipo: 'pagados' | 'porPagar'; etiqueta: string; monto: number }) {
  const ficha = FICHAS[tipo];
  return (
    <BorderGlow
      backgroundColor={ficha.fondo}
      glowColor={ficha.glow}
      colors={ficha.colores}
      borderRadius={20}
      glowRadius={34}
      fillOpacity={0.35}
      className="min-w-0"
    >
      <div className="px-3.5 py-3" style={{ color: ficha.texto }}>
        <span className="block text-[13px] font-semibold">{etiqueta}</span>
        <span className="mt-1 block text-[21px] leading-tight font-bold tracking-[-0.02em] cifras">
          <MontoAnimado monto={monto} />
        </span>
      </div>
    </BorderGlow>
  );
}

// Lo primero de "Debes": tarjeta de vidrio oscuro con el fondo vivo de la
// brecha. Arriba lo que falta por pagar; en medio, lo que llevas pagado partido
// en lo que bajó tu deuda y lo que fueron intereses (la pregunta de quien paga un
// crédito); y abajo las dos cifras de intereses: lo que ya se fue y lo que falta.
export function CabeceraCreditos({ resumen }: Props) {
  const listo = useMontajeDiferido();
  const { porPagar, activos, vencidos, interesesPagados, interesesPorPagar, capitalPagado, cuotasDelMes } = resumen;
  const hayPagado = capitalPagado + interesesPagados > 0;
  return (
    <section
      className="dark relative mx-4 mt-1 overflow-hidden rounded-[32px] p-4 text-white"
      aria-label="Resumen de tus créditos"
    >
      {listo && <FondoVidrio />}

      <div className="relative">
        <BlockHeader className="m-0! mb-1! px-0! text-[15px] font-semibold text-white/75">Te falta por pagar</BlockHeader>
        <p className="m-0 text-[48px] leading-[1.05] font-bold tracking-[-0.03em] cifras">
          <MontoAnimado monto={porPagar} />
        </p>
        <p className="m-0 mt-1 text-[14px] text-white/70">
          {activos === 0 ? 'Sin créditos activos' : `${activos} ${activos === 1 ? 'crédito' : 'créditos'}`}
          {cuotasDelMes > 0 && <> · este mes {formatearMonto(cuotasDelMes)}</>}
          {vencidos > 0 && (
            <span className="font-semibold" style={{ color: '#ff8c99' }}>
              {' · '}
              {vencidos} {vencidos === 1 ? 'cuota atrasada' : 'cuotas atrasadas'}
            </span>
          )}
        </p>

        {hayPagado && (
          <div className="mt-5 rounded-[22px] bg-white/[0.07] p-4 ring-1 ring-white/10">
            <p className="m-0 mb-3 text-[15px] font-semibold text-white/90">Lo que llevas pagado, partido en dos</p>
            <BarraReparto capital={capitalPagado} intereses={interesesPagados} sobreOscuro />
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Ficha tipo="pagados" etiqueta="Intereses pagados" monto={interesesPagados} />
          <Ficha tipo="porPagar" etiqueta="Intereses por pagar" monto={interesesPorPagar} />
        </div>
      </div>
    </section>
  );
}
