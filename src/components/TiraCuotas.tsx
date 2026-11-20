interface Props {
  plazo: number;
  pagadas: number;
  // Sobre fondo oscuro (tarjetas de vidrio) o sobre la hoja clara.
  sobreOscuro?: boolean;
  // Cuota que toca pagar y está atrasada: la siguiente se marca en coral.
  atrasada?: boolean;
}

const VERDE = '#31d494';
const CORAL = '#ff7080';
// Con más cuotas que esto los segmentos serían rayitas ilegibles: barra continua.
const MAXIMO_SEGMENTOS = 60;

// Una rayita por cuota: las pagadas en verde, la que toca con un latido suave
// (coral si está atrasada) y las que faltan apagadas. De un vistazo se ve en
// qué cuota vas y cuántas faltan, sin leer números. Entran en cascada con
// transform y opacity (reglas `.tira-cuota` en index.css).
export function TiraCuotas({ plazo, pagadas, sobreOscuro = false, atrasada = false }: Props) {
  const apagado = sobreOscuro ? 'bg-white/15' : 'bg-black/10 dark:bg-white/15';

  if (plazo > MAXIMO_SEGMENTOS) {
    return (
      <span className={`block h-2.5 overflow-hidden rounded-full ${apagado}`} aria-hidden="true">
        <span className="barra-progreso block h-full origin-left rounded-full" style={{ background: VERDE, transform: `scaleX(${pagadas / plazo})` }} />
      </span>
    );
  }

  return (
    <span className="flex gap-[3px]" role="img" aria-label={`${pagadas} de ${plazo} cuotas pagadas`}>
      {Array.from({ length: plazo }, (_, i) => {
        const estado = i < pagadas ? 'pagada' : i === pagadas ? 'siguiente' : 'falta';
        return (
          <span
            key={i}
            data-estado={estado}
            className={`tira-cuota h-2.5 min-w-0 flex-1 rounded-[3px] ${estado === 'falta' ? apagado : ''}`}
            style={
              {
                '--i': i,
                background: estado === 'pagada' ? VERDE : estado === 'siguiente' ? (atrasada ? CORAL : sobreOscuro ? '#ffffff' : 'var(--color-primary)') : undefined,
              } as React.CSSProperties
            }
          />
        );
      })}
    </span>
  );
}
