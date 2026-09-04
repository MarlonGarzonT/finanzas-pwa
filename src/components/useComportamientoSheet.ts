import { useEffect, useRef, useState, type CSSProperties, type FocusEvent, type PointerEvent } from 'react';

interface ViewportSheet {
  top: number;
  height: number;
}

export interface GestosSheet {
  overlayStyle: CSSProperties | undefined;
  sheetStyle: CSSProperties;
  arrastrando: boolean;
  onPointerDownHandle: (e: PointerEvent<HTMLDivElement>) => void;
  onPointerMoveHandle: (e: PointerEvent<HTMLDivElement>) => void;
  onPointerUpHandle: () => void;
  onFocusCaptureSheet: (e: FocusEvent<HTMLDivElement>) => void;
}

// El overlay se ancla al visualViewport (no al viewport de layout): en iOS,
// cuando el teclado abre, el navegador "paniza" el viewport visual en vez de
// achicar el layout, y un overlay con inset:0 fijo queda más alto que el area
// visible real. Eso sobraba espacio para hacer scroll y el gesto de cierre se
// terminaba "escapando" hacia la barra de Safari. Fijando top/height al
// visualViewport, el sheet siempre coincide con lo que realmente se ve.
// También agrega el gesto de arrastrar el handle hacia abajo para cerrar,
// como cualquier bottom sheet nativo.
export function useGestosSheet(abierto: boolean, onCerrar: () => void): GestosSheet {
  const [viewport, setViewport] = useState<ViewportSheet | null>(null);
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
      setViewport(null);
    };
  }, [abierto]);

  function onPointerDownHandle(e: PointerEvent<HTMLDivElement>) {
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

  function onPointerMoveHandle(e: PointerEvent<HTMLDivElement>) {
    if (!arrastrandoRef.current) return;
    const delta = Math.max(0, e.clientY - inicioArrastreRef.current);
    arrastreYRef.current = delta;
    setArrastreY(delta);
  }

  function onPointerUpHandle() {
    if (!arrastrandoRef.current) return;
    arrastrandoRef.current = false;
    setArrastrando(false);
    const debeCerrar = arrastreYRef.current > 90;
    arrastreYRef.current = 0;
    setArrastreY(0);
    if (debeCerrar) onCerrar();
  }

  function onFocusCaptureSheet(e: FocusEvent<HTMLDivElement>) {
    const campo = e.target;
    if (!(campo instanceof HTMLInputElement)) return;
    // Se espera a que el teclado termine de animarse antes de centrar el campo,
    // si no el cálculo de scroll se hace contra el tamaño previo del viewport.
    setTimeout(() => campo.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
  }

  return {
    overlayStyle: viewport ? { top: viewport.top, height: viewport.height, bottom: 'auto' } : undefined,
    sheetStyle: {
      maxHeight: viewport ? viewport.height - 16 : undefined,
      transform: arrastreY ? `translateY(${arrastreY}px)` : undefined,
    },
    arrastrando,
    onPointerDownHandle,
    onPointerMoveHandle,
    onPointerUpHandle,
    onFocusCaptureSheet,
  };
}

// Bloquea el scroll de la página de fondo mientras un bottom sheet está
// abierto. Solo debe usarlo el sheet raíz (el más externo): si dos sheets
// anidados lo llamaran a la vez, el segundo pisaría el scrollY que el
// primero necesita restaurar al cerrarse.
export function useBloqueoDeFondo(abierto: boolean) {
  useEffect(() => {
    if (!abierto) return;
    const scrollY = window.scrollY;
    const { position, top, width } = document.body.style;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    return () => {
      document.body.style.position = position;
      document.body.style.top = top;
      document.body.style.width = width;
      window.scrollTo(0, scrollY);
    };
  }, [abierto]);

  // Bloqueo "duro": además de fijar el body, se cancela cualquier gesto de
  // scroll táctil que no venga de dentro de algún sheet. El body fijo por sí
  // solo a veces no basta en iOS si el gesto arranca sobre el overlay de fondo.
  useEffect(() => {
    if (!abierto) return;
    function bloquearScroll(e: TouchEvent) {
      const objetivo = e.target as Element | null;
      if (objetivo?.closest('.sheet')) return;
      e.preventDefault();
    }
    document.addEventListener('touchmove', bloquearScroll, { passive: false });
    return () => document.removeEventListener('touchmove', bloquearScroll);
  }, [abierto]);
}
