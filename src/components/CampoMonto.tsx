import type { Tipo } from '../types';

interface Props {
  valor: string;
  onCambiar: (soloDigitos: string) => void;
  tono?: Tipo;
  autoFocus?: boolean;
  etiqueta?: string;
}

// El monto es el protagonista de cada formulario de dinero: grande, centrado
// y con teclado numérico. Guarda solo dígitos y muestra separador de miles.
export function CampoMonto({ valor, onCambiar, tono, autoFocus, etiqueta = 'Monto' }: Props) {
  // Estilo Apple Card: solo el ingreso lleva color; el gasto se escribe en el
  // color normal del texto (su signo − ya dice que sale).
  const color = tono === 'ingreso' ? 'text-ingreso' : '';
  const texto = valor ? Number(valor).toLocaleString('es-CO') : '';
  // Con montos largos la letra se achica para que nunca se recorte a 360px.
  const tamanoFuente = texto.length > 12 ? 26 : texto.length > 9 ? 32 : texto.length > 7 ? 38 : 44;
  return (
    <label className="flex cursor-text items-baseline justify-center gap-0.5 py-1">
      <span className="sr-only">{etiqueta}</span>
      <span className={`text-[28px] font-semibold ${color || 'text-secundario'}`} aria-hidden="true">
        $
      </span>
      {/* El ancho sigue a las cifras para que el "$" quede pegado al monto,
          como en la calculadora de iOS, en vez de flotar a un lado. */}
      <input
        inputMode="numeric"
        enterKeyHint="done"
        autoComplete="off"
        placeholder="0"
        value={texto}
        onChange={(e) => onCambiar(e.target.value.replace(/\D/g, ''))}
        autoFocus={autoFocus}
        style={{ width: `${Math.max(1, texto.length) * 0.62 + 0.2}em`, fontSize: tamanoFuente }}
        className={`max-w-[calc(100vw-5rem)] min-w-[1ch] bg-transparent text-left leading-tight transition-[font-size] duration-150 font-bold tracking-tight cifras placeholder-black/45 focus:outline-none dark:placeholder-white/50 ${color}`}
      />
    </label>
  );
}
