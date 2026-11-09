import { Badge, Tabbar, TabbarLink, ToolbarPane } from 'konsta/react';
import type { ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { usePrestamos } from '../data/usePrestamos';
import { IconoHistorial, IconoPerfil, IconoPrestamos, IconoReportes, IconoResumen } from './Iconos';

interface Pestana {
  ruta: string;
  etiqueta: string;
  icono: ReactNode;
}

const PESTANAS: Pestana[] = [
  { ruta: '/', etiqueta: 'Resumen', icono: <IconoResumen className="size-7" /> },
  { ruta: '/historial', etiqueta: 'Historial', icono: <IconoHistorial className="size-7" /> },
  { ruta: '/reportes', etiqueta: 'Reportes', icono: <IconoReportes className="size-7" /> },
  { ruta: '/prestamos', etiqueta: 'Préstamos', icono: <IconoPrestamos className="size-7" /> },
  { ruta: '/perfil', etiqueta: 'Perfil', icono: <IconoPerfil className="size-7" /> },
];

// Barra de pestañas de iOS: las cinco secciones de primer nivel siempre a
// un toque. Préstamos lleva una insignia con los vencidos, para que no se
// pierdan aunque el teléfono no reciba notificaciones push. Cada pestaña es un link real (NavLink) para que funcione con
// teclado y lector de pantalla, no solo con el dedo.
export function BarraPestanas() {
  const { pathname } = useLocation();
  const vencidos = usePrestamos().resumen.vencidos;

  function estaActiva(ruta: string) {
    return ruta === '/' ? pathname === '/' : pathname.startsWith(ruta);
  }

  return (
    <Tabbar labels icons className="barra-pestanas fixed bottom-0 left-0 z-30">
      <ToolbarPane>
        {PESTANAS.map((p) => (
          <TabbarLink
            key={p.ruta}
            active={estaActiva(p.ruta)}
            icon={
              p.ruta === '/prestamos' && vencidos > 0 ? (
                <span className="relative">
                  {p.icono}
                  <Badge small className="absolute -top-1 -right-2" aria-hidden="true">
                    {vencidos}
                  </Badge>
                </span>
              ) : (
                p.icono
              )
            }
            label={p.etiqueta}
            linkProps={{
              component: NavLink,
              to: p.ruta,
              end: p.ruta === '/',
              'aria-current': estaActiva(p.ruta) ? 'page' : undefined,
              'aria-label':
                p.ruta === '/prestamos' && vencidos > 0
                  ? `${p.etiqueta}, ${vencidos} ${vencidos === 1 ? 'vencido' : 'vencidos'}`
                  : undefined,
            }}
          />
        ))}
      </ToolbarPane>
    </Tabbar>
  );
}
