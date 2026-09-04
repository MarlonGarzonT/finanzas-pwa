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
// abierto. Solo debe usarlo el sheet raíz (el más externo).
//
// OJO: esto NO fija document.body con position:fixed. #root ya tiene
// overflow:hidden (ver theme.css), asi que la pagina no tiene de donde
// scrollear en primer lugar. Fijar el body ademas de eso resultó
// contraproducente: en iOS, cuando el teclado abre, Safari a veces sigue
// intentando "scrollear" el documento para revelar el campo enfocado
// (ignorando el overflow:hidden), y ese intento nativo peleaba con nuestro
// position:fixed (calculado una sola vez al abrir), dejando un hueco visible
// entre el sheet y la barra de Safari. Sin el body fijo, no hay dos
// mecanismos compitiendo por la misma posición.
export function useBloqueoDeFondo(abierto: boolean) {
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

  // Red de seguridad: si algo (Safari intentando revelar un campo enfocado,
  // el propio teclado, etc.) mueve el scroll del documento igual, se corrige
  // de inmediato a 0. No debería hacer falta casi nunca ya que #root no
  // tiene de donde scrollear, pero si Safari lo fuerza, esto lo revierte en
  // vez de dejar que el hueco quede visible.
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
