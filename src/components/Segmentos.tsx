export type TonoSegmento = 'normal' | 'intereses' | 'alerta' | 'ingreso';

export interface Segmento {
  etiqueta: string;
  valor: string;
  tono?: TonoSegmento;
}

interface Props {
  items: Segmento[];
  // Aviso de lectura para quien usa lector de pantalla.
  etiqueta?: string;
  // Sobre una tarjeta de fondo oscuro: celdas translúcidas y textos claros.
  sobreOscuro?: boolean;
}

const COLOR_VALOR_OSCURO: Record<TonoSegmento, string> = {
  normal: 'text-white',
  intereses: 'text-[#ff8c99]',
  alerta: 'text-[#ff8c99]',
  ingreso: 'text-[#4ee0a8]',
};

const COLOR_VALOR: Record<TonoSegmento, string> = {
  normal: '',
  intereses: 'text-intereses',
  alerta: 'text-alerta',
  ingreso: 'text-ingreso',
};

// La información importante, en segmentos: una banda con tantas celdas como
// datos, cada una con su etiqueta pequeña arriba y su valor debajo, separadas
// por una línea fina (como el control segmentado de iOS, pero de lectura).
// Nada de frases sueltas: cada dato se escanea sin leer.
export function Segmentos({ items, etiqueta, sobreOscuro = false }: Props) {
  return (
    <dl
      aria-label={etiqueta}
      className={`m-0 grid divide-x rounded-2xl ${sobreOscuro ? 'divide-white/15 bg-white/10' : 'divide-black/[0.07] bg-black/[0.04] dark:divide-white/10 dark:bg-white/[0.07]'}`}
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      {items.map((s) => (
        <div key={s.etiqueta} className="min-w-0 px-3 py-2.5">
          <dt className={`truncate text-[12px] ${sobreOscuro ? 'text-white/65' : 'text-secundario'}`}>{s.etiqueta}</dt>
          <dd className={`m-0 truncate text-[16px] leading-tight font-semibold cifras ${(sobreOscuro ? COLOR_VALOR_OSCURO : COLOR_VALOR)[s.tono ?? 'normal']}`}>{s.valor}</dd>
        </div>
      ))}
    </dl>
  );
}

interface PropsAviso {
  icono?: React.ReactNode;
  children: React.ReactNode;
}

// Una nota que sí hace falta (por qué un número es aproximado, cómo cuenta un
// pago), en un recuadro con ícono: se ve como parte de la pantalla, no como un
// párrafo suelto.
export function Aviso({ icono, children }: PropsAviso) {
  return (
    <div className="flex items-start gap-2.5 rounded-2xl bg-primary/10 px-3.5 py-3 text-[13px] leading-snug">
      <span className="mt-px flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[12px] font-bold text-white" aria-hidden="true">
        {icono ?? 'i'}
      </span>
      <span className="min-w-0">{children}</span>
    </div>
  );
}
