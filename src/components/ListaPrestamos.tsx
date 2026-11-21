import type { EstadoPrestamo } from '../utils/prestamos';
import { TarjetaPrestamo } from './TarjetaPrestamo';

interface Props {
  etiqueta: string;
  prestamos: EstadoPrestamo[];
  onAbrir: (prestamo: EstadoPrestamo) => void;
  onRegistrarPago: (prestamo: EstadoPrestamo) => void;
}

// Una tarjeta por persona, separadas entre sí (no una lista pegada): cada
// préstamo es un asunto distinto con su propia acción.
export function ListaPrestamos({ etiqueta, prestamos, onAbrir, onRegistrarPago }: Props) {
  return (
    <ul aria-label={etiqueta} className="m-0 flex list-none flex-col gap-3 px-4 py-0 lg:grid lg:grid-cols-2 lg:gap-4 lg:px-0 min-[1500px]:grid-cols-3">
      {prestamos.map((p) => (
        <TarjetaPrestamo key={p.id} prestamo={p} onAbrir={onAbrir} onRegistrarPago={onRegistrarPago} />
      ))}
    </ul>
  );
}
