import { Block, Button } from 'konsta/react';
import { IconoMas } from './Iconos';

interface Props {
  onAgregar: () => void;
}

const PASOS: { titulo: string; texto: string }[] = [
  { titulo: 'Cuéntanos tu crédito', texto: 'Cuánto te prestaron, cuánto pagas al mes y en cuántas cuotas.' },
  { titulo: 'Calculamos los intereses', texto: 'Te decimos cuánto de lo que pagas se va en intereses y cuánto baja tu deuda.' },
  { titulo: 'Anota cada cuota', texto: 'Cada mes que pagues la registras y ves cuántas llevas, cuánto has pagado y cuánto falta.' },
];

// Primera vez en "Debes": para qué sirve en tres pasos y un solo botón.
export function CreditosVacio({ onAgregar }: Props) {
  return (
    <Block strong inset className="rounded-3xl p-5">
      <span className="flex size-12 items-center justify-center rounded-[14px] bg-primary/12 text-[26px]" aria-hidden="true">
        🏦
      </span>

      <h2 className="m-0 mt-4 text-[22px] leading-tight font-bold tracking-[-0.01em]">¿Pagas un crédito?</h2>
      <p className="m-0 mt-1.5 text-[15px] leading-snug text-secundario">
        La moto, el carro, la casa… Aquí ves cuánto de tu cuota son intereses y cuánto te falta para terminar.
      </p>

      <ol className="m-0 mt-5 flex list-none flex-col p-0">
        {PASOS.map(({ titulo, texto }, indice) => (
          <li key={titulo} className="relative flex gap-3 pb-5 last:pb-0">
            {indice < PASOS.length - 1 && (
              <span className="absolute top-8 bottom-0 left-[15px] w-px bg-black/10 dark:bg-white/15" aria-hidden="true" />
            )}
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-[15px] font-semibold text-white"
              aria-hidden="true"
            >
              {indice + 1}
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="m-0 text-[16px] font-semibold">{titulo}</p>
              <p className="m-0 mt-0.5 text-[14px] leading-snug text-secundario">{texto}</p>
            </div>
          </li>
        ))}
      </ol>

      <Button large rounded onClick={onAgregar} className="mt-6 gap-2 normal-case">
        <IconoMas className="size-5" />
        Registrar mi crédito
      </Button>
    </Block>
  );
}
