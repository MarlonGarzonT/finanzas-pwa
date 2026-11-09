import { Preloader } from 'konsta/react';

export function Cargando() {
  return (
    <div className="flex flex-1 items-center justify-center py-24" role="status" aria-label="Cargando">
      <Preloader />
    </div>
  );
}
