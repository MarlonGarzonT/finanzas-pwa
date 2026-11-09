import { BlockTitle, List, ListItem } from 'konsta/react';
import { formatearFechaCorta, formatearMonto } from '../utils/fechas';
import { formatearDia, type EstadoPrestamo } from '../utils/prestamos';

interface Props {
  titulo: string;
  prestamos: EstadoPrestamo[];
  onSeleccionar: (prestamo: EstadoPrestamo) => void;
}

function detalle(p: EstadoPrestamo) {
  if (p.pagado) return <span>Te pagó el {p.fechaPago ? formatearFechaCorta(p.fechaPago) : '—'}</span>;
  const abonado = p.abonado > 0 ? ` · abonó ${formatearMonto(p.abonado)}` : '';
  if (p.vencido) {
    const atraso = p.diasVencido === 1 ? 'Venció ayer' : `Venció hace ${p.diasVencido} días`;
    return (
      <span>
        <span className="font-medium text-alerta">{atraso}</span>
        {abonado}
      </span>
    );
  }
  return (
    <span>
      Te paga el {formatearDia(p.fechaDevolucion)}
      {abonado}
    </span>
  );
}

export function ListaPrestamos({ titulo, prestamos, onSeleccionar }: Props) {
  if (prestamos.length === 0) return null;
  return (
    <>
      <BlockTitle>{titulo}</BlockTitle>
      <List strong inset dividers>
        {prestamos.map((p) => (
          <ListItem
            key={p.id}
            link
            linkComponent="button"
            linkProps={{
              type: 'button',
              'aria-label': p.pagado
                ? `${p.persona}, te pagó ${formatearMonto(p.monto)}. Ver detalle`
                : `${p.persona}, te debe ${formatearMonto(p.saldo)}${p.vencido ? ', vencido' : ''}. Ver detalle`,
            }}
            onClick={() => onSeleccionar(p)}
            title={<span className="block truncate">{p.persona}</span>}
            text={detalle(p)}
            after={
              <span className={`text-[17px] font-semibold cifras ${p.pagado ? 'text-secundario' : 'text-black dark:text-white'}`}>
                {formatearMonto(p.pagado ? p.monto : p.saldo)}
              </span>
            }
            contentClassName="w-full text-left [&_.shrink]:min-w-0 [&>*:last-child]:min-w-0"
          />
        ))}
      </List>
    </>
  );
}
