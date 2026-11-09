import { Segmented, SegmentedButton } from 'konsta/react';
import type { ComponentProps, ReactNode } from 'react';

interface PropsSelector {
  children: ReactNode;
  className?: string;
}

// Segmented de Konsta con el material Liquid Glass de iOS 26: la cápsula es
// vidrio translúcido con reflejos en los bordes y el resaltado es una "gota"
// de vidrio que se desliza (curva de resorte en .selector-fluido, index.css).
// Son los mismos materiales que Konsta usa en la barra de pestañas y en los
// botones de la barra superior, así todo el vidrio de la app es uno solo.
export function SelectorVidrio({ children, className = '' }: PropsSelector) {
  return (
    <Segmented
      strong
      rounded
      className={`selector-fluido backdrop-blur-lg ${className}`}
      colors={{
        strongBgIos: 'bg-black/[0.07] dark:bg-ios-dark-glass shadow-ios-light-glass dark:shadow-ios-dark-glass',
        strongHighlightBgIos:
          'bg-white dark:bg-white/15 shadow-ios-light-glass-thumb! dark:shadow-ios-dark-glass-thumb!',
      }}
    >
      {children}
    </Segmented>
  );
}

type PropsOpcion = ComponentProps<typeof SegmentedButton> & { active: boolean };

// Opción del selector. En oscuro el resaltado es vidrio oscuro, así que el
// texto activo va en blanco (Konsta lo pone negro por defecto).
// (SegmentedButton reenvía `colors` al Button interno aunque su tipo no lo
// declare; por eso va como spread.)
const COLORES_OPCION = { colors: { segmentedStrongTextIos: 'text-black dark:text-white' } };

export function OpcionSelector({ active, children, ...resto }: PropsOpcion) {
  return (
    <SegmentedButton active={active} aria-pressed={active} {...COLORES_OPCION} {...resto}>
      {children}
    </SegmentedButton>
  );
}
