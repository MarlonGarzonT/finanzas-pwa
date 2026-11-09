import { useNavigate } from 'react-router-dom';
import type { Transaccion } from '../types';

export interface EstadoNavegacionPrestamos {
  prestamoId?: string;
}

// Un movimiento de préstamo (la salida o un abono) no se edita como un gasto
// cualquiera: no tiene categoría y cambiarle el monto descuadraría el saldo.
// Tocarlo lleva a su préstamo; el resto abre el editor de siempre.
export function useAbrirMovimiento(editar: (t: Transaccion) => void): (t: Transaccion) => void {
  const navegar = useNavigate();
  return (t) => {
    if (t.prestamoId) {
      const estado: EstadoNavegacionPrestamos = { prestamoId: t.prestamoId };
      navegar('/prestamos', { state: estado });
    } else {
      editar(t);
    }
  };
}
