import ShinyText from './reactbits/ShinyText';
import StarBorder from './reactbits/StarBorder';
import { IconoMas } from './Iconos';
import { CLASES_BOTON_FLOTANTE } from './BotonFlotante';

interface Props {
  etiqueta: string;
  texto?: string;
  onClick: () => void;
}

// Versión con efectos de React Bits del botón flotante principal: una luz
// blanca da la vuelta al contorno (StarBorder, con pulso al tocar) y, si el
// botón lleva texto, un destello recorre las letras (ShinyText). Va en su
// propio chunk (se carga con `lazy` desde BotonFlotante) para que los efectos
// no pesen en el arranque de la app.
export default function BotonFlotanteEfectos({ etiqueta, texto, onClick }: Props) {
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
      radius={28}
      thickness={2}
      duration={3.6}
      trailLength={0.32}
      stars={1}
      glow={0.55}
      sparkle
      hover="none"
      // `!` porque la base de StarBorder fija su propio padding y `relative`.
      className={`${CLASES_BOTON_FLOTANTE} fixed! px-0! py-0! ${texto ? 'min-w-14 px-5!' : 'size-14'}`}
    >
      <IconoMas className="size-7" />
      {texto && (
        <ShinyText
          text={texto}
          color="rgba(255, 255, 255, 0.85)"
          shineColor="#ffffff"
          speed={2.4}
          delay={1.6}
          shineWidth={50}
          className="text-[16px] font-semibold"
        />
      )}
    </StarBorder>
  );
}
