import { useEffect, useRef, useState, type CSSProperties, type FocusEvent, type PointerEvent } from 'react';

interface ViewportVisible {
  top: number;
  height: number;
}

export interface GestosHoja {
  estiloHoja: CSSProperties;
  alturaMaxima: number | undefined;
  onPointerDownAsa: (e: PointerEvent<HTMLElement>) => void;
  onPointerMoveAsa: (e: PointerEvent<HTMLElement>) => void;
  onPointerUpAsa: () => void;
  onFocusCaptureHoja: (e: FocusEvent<HTMLElement>) => void;
}

const DISTANCIA_PARA_CERRAR = 90;

// La hoja se ancla al visualViewport (no al viewport de layout): en iOS,
// cuando el teclado abre, el navegador "paniza" el viewport visual en vez de
// achicar el layout, y una hoja pegada al borde inferior del layout queda
// escondida detrás del teclado. Fijando su borde inferior al visualViewport,
// la hoja siempre coincide con lo que realmente se ve. También agrega el
// gesto de arrastrar el asa hacia abajo para cerrar, como un sheet nativo.
export function useGestosHoja(abierto: boolean, onCerrar: () => void): GestosHoja {
  const [viewport, setViewport] = useState<ViewportVisible | null>(null);
  const [arrastreY, setArrastreY] = useState(0);
  const [arrastrando, setArrastrando] = useState(false);
  const inicioArrastreRef = useRef(0);
  const arrastrandoRef = useRef(false);
  const arrastreYRef = useRef(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!abierto || !vv) return;

    function actualizar() {
      setViewport({ top: vv!.offsetTop, height: vv!.height });
    }

    actualizar();
    vv.addEventListener('resize', actualizar);
    vv.addEventListener('scroll', actualizar);
    return () => {
      vv.removeEventListener('resize', actualizar);
      vv.removeEventListener('scroll', actualizar);
    };
  }, [abierto]);

  function onPointerDownAsa(e: PointerEvent<HTMLElement>) {
    arrastrandoRef.current = true;
    inicioArrastreRef.current = e.clientY;
    setArrastrando(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Algunos navegadores/eventos sintéticos no soportan la captura; el
      // arrastre sigue funcionando igual con los listeners normales.
    }
  }

  function onPointerMoveAsa(e: PointerEvent<HTMLElement>) {
    if (!arrastrandoRef.current) return;
    const delta = Math.max(0, e.clientY - inicioArrastreRef.current);
    arrastreYRef.current = delta;
    setArrastreY(delta);
  }

  function onPointerUpAsa() {
    if (!arrastrandoRef.current) return;
    arrastrandoRef.current = false;
    setArrastrando(false);
    const debeCerrar = arrastreYRef.current > DISTANCIA_PARA_CERRAR;
    arrastreYRef.current = 0;
    setArrastreY(0);
    if (debeCerrar) onCerrar();
  }

  function onFocusCaptureHoja(e: FocusEvent<HTMLElement>) {
    const campo = e.target;
    if (!(campo instanceof HTMLInputElement)) return;
    // Se espera a que el teclado termine de animarse antes de mover el campo,
    // si no el cálculo de scroll se hace contra el tamaño previo del viewport.
    // "nearest" (no "center") porque centrar campos que ya están cerca del
    // borde superior del sheet (ej. el campo de texto, justo antes de los
    // chips de categoría) desplazaba de más y tapaba los chips debajo del
    // header sticky o los sacaba de la vista.
    setTimeout(() => campo.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 300);
  }

  const estiloHoja: CSSProperties = {};
  if (viewport) estiloHoja.top = viewport.top + viewport.height;
  // Konsta abre la hoja con -translate-y-full (propiedad `translate` en
  // Tailwind v4, no `transform`); mientras se arrastra se suma el
  // desplazamiento del dedo y se apaga la transición para que siga 1:1.
  if (arrastreY > 0) estiloHoja.translate = `0 calc(-100% + ${arrastreY}px)`;
  if (arrastrando) estiloHoja.transitionDuration = '0ms';

  return {
    estiloHoja,
    alturaMaxima: viewport ? viewport.height - 12 : undefined,
    onPointerDownAsa,
    onPointerMoveAsa,
    onPointerUpAsa,
    onFocusCaptureHoja,
  };
}

// Red de seguridad: si algo (Safari intentando revelar un campo enfocado,
// el propio teclado, etc.) mueve el scroll del documento, se corrige de
// inmediato a 0. html/body ya tienen overflow:hidden, así que la página no
// tiene de dónde scrollear; esto solo revierte lo que Safari fuerce.
//
// OJO: no se fija document.body con position:fixed. En iOS, cuando el
// teclado abre, Safari a veces sigue intentando "scrollear" el documento
// para revelar el campo enfocado, y ese intento peleaba con un body fijo
// (calculado una sola vez al abrir), dejando un hueco visible.
export function useBloqueoDeFondo(abierto: boolean) {
  useEffect(() => {
    if (!abierto) return;
    function corregirScroll() {
      if (window.scrollX !== 0 || window.scrollY !== 0) {
        window.scrollTo(0, 0);
      }
    }
    window.addEventListener('scroll', corregirScroll, { passive: true });
    return () => window.removeEventListener('scroll', corregirScroll);
  }, [abierto]);
}
