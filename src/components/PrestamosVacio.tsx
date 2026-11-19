import { Block, Button } from 'konsta/react';
import { IconoMas, IconoPrestamos } from './Iconos';

interface Props {
  onAgregar: () => void;
}

const PASOS: { titulo: string; texto: string }[] = [
  { titulo: 'Anotas el préstamo', texto: 'A quién le prestas, cuánto y cuándo te paga. Sale de tu Disponible, pero no cuenta como gasto.' },
  { titulo: 'Registras cada pago', texto: 'Cuando te devuelvan algo, lo anotas: completo o por partes. Vuelve a tu Disponible.' },
  { titulo: 'Se cierra solo', texto: 'Al recibir todo, el préstamo pasa a "Pagados". Si se pasa la fecha, te avisamos.' },
];

// Primera vez en Préstamos: cómo funciona en tres pasos, en el orden en que
// va a ocurrir, y un solo botón para empezar.
export function PrestamosVacio({ onAgregar }: Props) {
  return (
    <Block strong inset className="rounded-3xl p-5">
      <span className="flex size-12 items-center justify-center rounded-[14px] bg-primary/12 text-primary" aria-hidden="true">
        <IconoPrestamos className="size-7" />
      </span>

      <h2 className="m-0 mt-4 text-[22px] leading-tight font-bold tracking-[-0.01em]">¿Le prestaste plata a alguien?</h2>
      <p className="m-0 mt-1.5 text-[15px] leading-snug text-secundario">
        Aquí llevas la cuenta de lo que te deben, para que nada se te olvide.
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
        Registrar mi primer préstamo
      </Button>
    </Block>
  );
}
