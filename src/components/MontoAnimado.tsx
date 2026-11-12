import Counter from './reactbits/Counter';

interface Props {
  // Monto a mostrar; se redondea y se muestra sin signo (el signo va aparte).
  monto: number;
  // Signo que antecede al monto: '−' en negativos, '+' donde la app lo usa.
  signo?: '' | '+' | '−';
  // Giro de entrada al aparecer (Reportes). Donde el monto se mira a diario
  // (Resumen, Préstamos) solo se anima cuando cambia.
  intro?: boolean;
}

const FORMATO: Intl.NumberFormatOptions = { maximumFractionDigits: 0 };

// Monto grande con dígitos que ruedan al cambiar (Counter de React Bits), con
// el mismo formato de formatearMonto: "$" + agrupación es-CO. Hereda tamaño,
// peso y color del texto que lo contiene. Sin desenfoque de movimiento: solo
// se anima transform y opacidad. Con "reducir movimiento" cambia sin animar,
// y el lector de pantalla lee el monto completo, no los dígitos sueltos.
export function MontoAnimado({ monto, signo = '', intro = false }: Props) {
  return (
    <Counter
      value={Math.abs(Math.round(monto))}
      locale="es-CO"
      format={FORMATO}
      prefix={`${signo}$`}
      fontSize="1em"
      duration={0.7}
      bounce={0.15}
      stagger={0.035}
      motionBlur={false}
      // Banda de desvanecido corta: el giro queda dentro de la línea del
      // monto y no invade el rótulo de arriba ("Disponible", "Te deben").
      fade={0.15}
      intro={intro}
    />
  );
}
