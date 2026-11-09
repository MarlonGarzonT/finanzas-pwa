import { Fragment } from 'react';
import { formatearMonto } from '../utils/fechas';

interface Props {
  ahorro: number;
  prestado: number;
  devuelto: number;
  className?: string;
}

// Lo que movió el Disponible sin ser gasto ni ingreso. Sin esta línea el
// Disponible no cuadraría con los totales de Gastos e Ingresos de al lado.
export function LineaApartes({ ahorro, prestado, devuelto, className = '' }: Props) {
  const partes: { clave: string; antes: string; monto: number; despues: string }[] = [];
  if (ahorro > 0) partes.push({ clave: 'ahorro', antes: 'Separaste', monto: ahorro, despues: ' para ahorro' });
  if (prestado > 0) partes.push({ clave: 'prestado', antes: 'Prestaste', monto: prestado, despues: '' });
  if (devuelto > 0) partes.push({ clave: 'devuelto', antes: 'Te devolvieron', monto: devuelto, despues: '' });
  if (partes.length === 0) return null;

  return (
    <p className={`m-0 text-[15px] leading-snug text-secundario ${className}`}>
      {partes.map((p, i) => (
        <Fragment key={p.clave}>
          {i > 0 && ' · '}
          {p.antes} <span className="font-semibold cifras">{formatearMonto(p.monto)}</span>
          {p.despues}
        </Fragment>
      ))}
    </p>
  );
}
