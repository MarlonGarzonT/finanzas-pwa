import { Tabbar, TabbarLink, ToolbarPane } from 'konsta/react';
import type { ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { IconoGrupos, IconoHistorial, IconoReportes, IconoResumen } from './Iconos';

interface Pestana {
  ruta: string;
  etiqueta: string;
  icono: ReactNode;
}

const PESTANAS: Pestana[] = [
  { ruta: '/', etiqueta: 'Resumen', icono: <IconoResumen className="size-7" /> },
  { ruta: '/historial', etiqueta: 'Historial', icono: <IconoHistorial className="size-7" /> },
  { ruta: '/reportes', etiqueta: 'Reportes', icono: <IconoReportes className="size-7" /> },
  { ruta: '/grupos', etiqueta: 'Grupos', icono: <IconoGrupos className="size-7" /> },
];

// Barra de pestañas de iOS: las cuatro secciones de primer nivel siempre a
// un toque. Cada pestaña es un link real (NavLink) para que funcione con
// teclado y lector de pantalla, no solo con el dedo.
export function BarraPestanas() {
  const { pathname } = useLocation();

  function estaActiva(ruta: string) {
    // "/grupos" también queda activa en /grupos/:id (el detalle de un grupo).
    return ruta === '/' ? pathname === '/' : pathname.startsWith(ruta);
  }

  return (
    <Tabbar labels icons className="barra-pestanas fixed bottom-0 left-0 z-30">
      <ToolbarPane>
        {PESTANAS.map((p) => (
          <TabbarLink
            key={p.ruta}
            active={estaActiva(p.ruta)}
            icon={p.icono}
            label={p.etiqueta}
            linkProps={{
              component: NavLink,
              to: p.ruta,
              end: p.ruta === '/',
              'aria-current': estaActiva(p.ruta) ? 'page' : undefined,
            }}
          />
        ))}
      </ToolbarPane>
    </Tabbar>
  );
}
