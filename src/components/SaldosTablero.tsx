import type { ReactNode } from 'react';
import type { DatosTablero } from '../data/useTablero';
import { formatearMonto } from '../utils/fechas';
import { AvatarEmoji } from './AvatarEmoji';
import { MontoAnimado } from './MontoAnimado';
import { Segmentos } from './Segmentos';
import { SuperficieVidrio } from './SuperficieVidrio';
import BorderGlow from './reactbits/BorderGlow';

const VERDE = '#31d494';

interface PropsTarjeta {
  emoji: string;
  color: string;
  titulo: string;
  monto: number;
  pie: ReactNode;
  retraso: number;
}

// Una de las tarjetas de saldo (como las cuentas del Excel): quién es, cuánto
// es y un dato de apoyo en segmento. Superficie de vidrio, sin efectos: la que
// llama la atención es la del Disponible.
function TarjetaSaldo({ emoji, color, titulo, monto, pie, retraso }: PropsTarjeta) {
  return (
    <div className="aparecer-suave" style={{ animationDelay: `${retraso}ms` }}>
      <SuperficieVidrio className="p-4">
        <div className="flex items-center gap-3">
          <AvatarEmoji emoji={emoji} color={color} />
          <div className="min-w-0 flex-1">
            <p className="m-0 text-[14px] text-secundario">{titulo}</p>
            <p className="m-0 text-[26px] leading-tight font-bold tracking-[-0.02em] cifras">
              <MontoAnimado monto={monto} />
            </p>
          </div>
        </div>
        <div className="mt-3">{pie}</div>
      </SuperficieVidrio>
    </div>
  );
}

interface Props {
  datos: DatosTablero;
}

// Columna izquierda del tablero. Arriba el Disponible del mes, que es lo que la
// persona viene a mirar, con la luz de BorderGlow y los dígitos que ruedan
// (Counter): es lo único del tablero que llama la atención. Debajo, lo demás
// que tiene o debe: ahorro apartado, lo que le deben y lo que debe en créditos.
export function SaldosTablero({ datos }: Props) {
  const { resumenDelMes, ahorroTotal, prestamos, creditos } = datos;
  const enNegativo = resumenDelMes.disponible < 0;
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-1">
      <div className="aparecer-suave md:col-span-2 lg:col-span-3 xl:col-span-1">
        <BorderGlow
          backgroundColor="#0e2a24"
          glowColor="158 66 52"
          colors={[VERDE, '#7ee0c4', '#217b56']}
          borderRadius={26}
          glowRadius={40}
          fillOpacity={0.35}
          className="min-w-0"
        >
          <div className="p-5 text-white">
            <p className="m-0 text-[15px] font-semibold" style={{ color: '#4ee0a8' }}>
              Disponible del mes
            </p>
            <p className={`m-0 mt-1 text-[44px] leading-[1.05] font-bold tracking-[-0.03em] cifras ${enNegativo ? 'text-[#ff8c99]' : ''}`}>
              <MontoAnimado monto={Math.abs(resumenDelMes.disponible)} signo={enNegativo ? '−' : ''} intro />
            </p>
            <div className="mt-4">
              <Segmentos
                sobreOscuro
                etiqueta="Ingresos y gastos del mes"
                items={[
                  { etiqueta: 'Ingresos', valor: formatearMonto(resumenDelMes.ingresos), tono: 'ingreso' },
                  { etiqueta: 'Gastos', valor: formatearMonto(resumenDelMes.gastos), tono: 'intereses' },
                ]}
              />
            </div>
          </div>
        </BorderGlow>
      </div>

      <TarjetaSaldo
        emoji="🐷"
        color="var(--categoria-rosa)"
        titulo="Ahorro apartado"
        monto={ahorroTotal}
        retraso={80}
        pie={<Segmentos items={[{ etiqueta: 'Este mes', valor: formatearMonto(resumenDelMes.ahorro) }]} />}
      />
      <TarjetaSaldo
        emoji="🤝"
        color="var(--categoria-azul)"
        titulo="Te deben"
        monto={prestamos.pendiente}
        retraso={140}
        pie={
          <Segmentos
            items={[
              { etiqueta: 'Personas', valor: String(prestamos.personas) },
              { etiqueta: 'Atrasados', valor: String(prestamos.vencidos), tono: prestamos.vencidos > 0 ? 'alerta' : 'normal' },
            ]}
          />
        }
      />
      <TarjetaSaldo
        emoji="🏦"
        color="var(--categoria-naranja)"
        titulo="Debes en créditos"
        monto={creditos.porPagar}
        retraso={200}
        pie={
          <Segmentos
            items={[
              { etiqueta: 'Créditos', valor: String(creditos.activos) },
              { etiqueta: 'Atrasadas', valor: String(creditos.vencidos), tono: creditos.vencidos > 0 ? 'alerta' : 'normal' },
            ]}
          />
        }
      />
    </div>
  );
}
