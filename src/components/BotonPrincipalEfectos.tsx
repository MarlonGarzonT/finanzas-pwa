import { CLASES_BOTON_PRINCIPAL } from './BotonPrincipal';
import ShinyText from './reactbits/ShinyText';
import StarBorder from './reactbits/StarBorder';

interface Props {
  texto: string;
  onClick: () => void;
  etiqueta?: string;
}

// Efectos de React Bits del botón principal (ver BotonPrincipal). Va en su
// propio chunk, el mismo de BotonFlotanteEfectos, para no pesar en el arranque.
export default function BotonPrincipalEfectos({ texto, onClick, etiqueta }: Props) {
  return (
    <StarBorder
      as="button"
      type="button"
      aria-label={etiqueta}
      onClick={onClick}
      theme="dark"
      color="#ffffff"
      backgroundColor="var(--color-primary)"
      textColor="#ffffff"
      borderColor="rgba(255, 255, 255, 0.3)"
      radius={26}
      thickness={2}
      duration={4}
      trailLength={0.3}
      stars={1}
      glow={0.5}
      sparkle
      hover="none"
      // `!` porque la base de StarBorder fija su propio padding y su display.
      className={`${CLASES_BOTON_PRINCIPAL} px-5! py-0!`}
    >
      <ShinyText
        text={texto}
        color="rgba(255, 255, 255, 0.88)"
        shineColor="#ffffff"
        speed={2.4}
        delay={1.8}
        shineWidth={50}
        className="text-[17px] font-semibold"
      />
    </StarBorder>
  );
}
