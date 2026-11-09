import { BlockTitle, List, ListItem } from 'konsta/react';
import type { Categoria, Transaccion } from '../types';
import { FilaMovimiento } from './FilaMovimiento';

interface Props {
  transacciones: Transaccion[];
  categoriaPorId: (id: string) => Categoria | undefined;
  onSeleccionar: (transaccion: Transaccion) => void;
  mensajeVacio?: string;
}

export function UltimosMovimientos({
  transacciones,
  categoriaPorId,
  onSeleccionar,
  mensajeVacio = 'Aún no registras movimientos.',
}: Props) {
  return (
    <>
      <BlockTitle>Movimientos del mes</BlockTitle>
      <List strong inset dividers>
        {transacciones.length === 0 ? (
          <ListItem title={<span className="text-secundario">{mensajeVacio}</span>} />
        ) : (
          transacciones.map((t) => (
            <FilaMovimiento
              key={t.id}
              transaccion={t}
              categoria={categoriaPorId(t.categoriaId)}
              onSeleccionar={onSeleccionar}
            />
          ))
        )}
      </List>
    </>
  );
}
