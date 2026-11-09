import type { ReactNode } from 'react';

interface PropsIcono {
  className?: string;
}

// Set de íconos propio, dibujado en una sola grilla (24px, trazo 1.8,
// extremos redondeados) para que se lea como SF Symbols sin cargar una
// fuente de íconos completa. Todos son decorativos: el texto accesible lo
// pone el botón o el link que los contiene.
function Trazo({ className = 'size-6', children }: PropsIcono & { children: ReactNode }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export function IconoResumen(props: PropsIcono) {
  return (
    <Trazo {...props}>
      <rect x="3" y="5.5" width="18" height="14" rx="3.5" />
      <path d="M3 10h18" />
      <path d="M15.5 15h2" />
    </Trazo>
  );
}

export function IconoHistorial(props: PropsIcono) {
  return (
    <Trazo {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </Trazo>
  );
}

export function IconoReportes(props: PropsIcono) {
  return (
    <Trazo {...props}>
      <path d="M5.5 19.5v-7" />
      <path d="M12 19.5v-15" />
      <path d="M18.5 19.5v-10" />
    </Trazo>
  );
}

export function IconoGrupos(props: PropsIcono) {
  return (
    <Trazo {...props}>
      <circle cx="9" cy="8.5" r="3.2" />
      <path d="M3.5 19.5c.6-3.3 2.8-5.2 5.5-5.2s4.9 1.9 5.5 5.2" />
      <circle cx="17" cy="9.5" r="2.5" />
      <path d="M16.2 14.4c2.3.3 3.8 2 4.3 5.1" />
    </Trazo>
  );
}

export function IconoMas(props: PropsIcono) {
  return (
    <Trazo {...props}>
      <path d="M12 5v14M5 12h14" />
    </Trazo>
  );
}

export function IconoMasOpciones(props: PropsIcono) {
  return (
    <Trazo {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12h.01M12 12h.01M16 12h.01" strokeWidth="2.6" />
    </Trazo>
  );
}

export function IconoFiltro(props: PropsIcono) {
  return (
    <Trazo {...props}>
      <path d="M4 7h16M7 12h10M10 17h4" />
    </Trazo>
  );
}

export function IconoChevronIzquierda(props: PropsIcono) {
  return (
    <Trazo {...props}>
      <path d="M14.5 5.5 8 12l6.5 6.5" />
    </Trazo>
  );
}

export function IconoChevronDerecha(props: PropsIcono) {
  return (
    <Trazo {...props}>
      <path d="M9.5 5.5 16 12l-6.5 6.5" />
    </Trazo>
  );
}

export function IconoChevronAbajo(props: PropsIcono) {
  return (
    <Trazo {...props}>
      <path d="M6 9.5l6 6 6-6" />
    </Trazo>
  );
}

export function IconoFlechaArriba(props: PropsIcono) {
  return (
    <Trazo {...props}>
      <path d="M12 19V5.5M6.5 11 12 5.5l5.5 5.5" />
    </Trazo>
  );
}

export function IconoRecargar(props: PropsIcono) {
  return (
    <Trazo {...props}>
      <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3" />
      <path d="M19.5 4.5v4.2h-4.2" />
    </Trazo>
  );
}

export function IconoCerrar(props: PropsIcono) {
  return (
    <Trazo {...props}>
      <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
    </Trazo>
  );
}

export function IconoDescargar(props: PropsIcono) {
  return (
    <Trazo {...props}>
      <path d="M12 4v10.5M7.5 10.5 12 15l4.5-4.5" />
      <path d="M5 15.5v2A2.5 2.5 0 0 0 7.5 20h9a2.5 2.5 0 0 0 2.5-2.5v-2" />
    </Trazo>
  );
}

export function IconoCompartir(props: PropsIcono) {
  return (
    <Trazo {...props}>
      <path d="M12 3.5v11M8 7.5l4-4 4 4" />
      <path d="M7 11H6a1.5 1.5 0 0 0-1.5 1.5v6A1.5 1.5 0 0 0 6 20h12a1.5 1.5 0 0 0 1.5-1.5v-6A1.5 1.5 0 0 0 18 11h-1" />
    </Trazo>
  );
}

export function IconoCopiar(props: PropsIcono) {
  return (
    <Trazo {...props}>
      <rect x="8.5" y="8.5" width="11" height="11" rx="2.5" />
      <path d="M15.5 8.5V6A1.5 1.5 0 0 0 14 4.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5" />
    </Trazo>
  );
}

export function IconoPapelera(props: PropsIcono) {
  return (
    <Trazo {...props}>
      <path d="M4.5 7h15M10 11v5.5M14 11v5.5" />
      <path d="M6.5 7l.8 11.2A2 2 0 0 0 9.3 20h5.4a2 2 0 0 0 2-1.8L17.5 7M9.5 7V4.5h5V7" />
    </Trazo>
  );
}

export function IconoFijo(props: PropsIcono) {
  return (
    <Trazo {...props}>
      <path d="M9 4h6l-.8 5.5 3 3H6.8l3-3L9 4z" />
      <path d="M12 12.5V20" />
    </Trazo>
  );
}

export function IconoTendencia({ sube, ...props }: PropsIcono & { sube: boolean }) {
  return (
    <Trazo {...props}>
      {sube ? <path d="M12 19V5.5M6.5 11 12 5.5l5.5 5.5" /> : <path d="M12 5v13.5M6.5 13l5.5 5.5 5.5-5.5" />}
    </Trazo>
  );
}

export function IconoCheck(props: PropsIcono) {
  return (
    <Trazo {...props}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </Trazo>
  );
}

export function IconoOjo(props: PropsIcono) {
  return (
    <Trazo {...props}>
      <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </Trazo>
  );
}

export function IconoOjoTachado(props: PropsIcono) {
  return (
    <Trazo {...props}>
      <path d="M10.6 5.6A10 10 0 0 1 12 5.5c6.4 0 10 6.5 10 6.5a17 17 0 0 1-2.6 3.4M6.6 6.6C3.6 8.4 2 12 2 12s3.6 6.5 10 6.5a9.7 9.7 0 0 0 5.4-1.6" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M3 3l18 18" />
    </Trazo>
  );
}
