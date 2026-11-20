import { Glass } from 'konsta/react';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
}

// Tarjeta con el material Liquid Glass de iOS 26 (el `Glass` de Konsta que ya
// usan la barra de pestañas y los selectores): translúcida, con reflejos en
// el borde y su sombra. Sin fondo de color ni animación detrás: el vidrio se
// ve por su borde y su profundidad, no por lo que tiene debajo.
export function SuperficieVidrio({ children, className = '' }: Props) {
  return (
    // El vidrio de Konsta trae touch-action: none (pensado para barras fijas);
    // en una tarjeta dentro de la página bloquearía el scroll.
    <Glass className={`overflow-hidden rounded-[26px] ${className}`} style={{ touchAction: 'manipulation' }}>
      {children}
    </Glass>
  );
}
