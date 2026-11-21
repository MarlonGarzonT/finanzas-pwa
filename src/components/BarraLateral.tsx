import { Badge } from 'konsta/react';
import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useCreditos } from '../data/useCreditos';
import { usePerfil } from '../data/usePerfil';
import { usePrestamos } from '../data/usePrestamos';
import { AvatarUsuario } from './AvatarUsuario';
import { IconoHistorial, IconoPerfil, IconoPrestamos, IconoReportes, IconoResumen } from './Iconos';
import { SuperficieVidrio } from './SuperficieVidrio';

interface Seccion {
  ruta: string;
  etiqueta: string;
  icono: ReactNode;
}

// En escritorio la entrada ("/") es el tablero, no el Resumen del celular.
const SECCIONES: Seccion[] = [
  { ruta: '/', etiqueta: 'Tablero', icono: <IconoResumen className="size-6" /> },
  { ruta: '/historial', etiqueta: 'Historial', icono: <IconoHistorial className="size-6" /> },
  { ruta: '/reportes', etiqueta: 'Reportes', icono: <IconoReportes className="size-6" /> },
  { ruta: '/prestamos', etiqueta: 'Préstamos', icono: <IconoPrestamos className="size-6" /> },
  { ruta: '/perfil', etiqueta: 'Perfil', icono: <IconoPerfil className="size-6" /> },
];

const BASE = import.meta.env.BASE_URL;

// Navegación de escritorio: una barra lateral de vidrio fija a la izquierda,
// que reemplaza a la barra de pestañas del celular (que solo se ve por debajo
// de 1024 px). Las mismas cinco secciones; la activa va en azul tintado y
// Préstamos lleva la insignia de lo vencido, como en la barra de pestañas.
export function BarraLateral() {
  const perfil = usePerfil();
  const vencidos = usePrestamos().resumen.vencidos + useCreditos().resumen.vencidos;

  return (
    <aside className="hidden h-full w-[288px] shrink-0 p-4 lg:block">
      <SuperficieVidrio className="flex h-full flex-col p-4">
        <div className="flex items-center gap-3 px-2 pt-1 pb-5">
          <img src={`${BASE}icons/icon-192.png`} alt="" width={40} height={40} className="size-10 rounded-[12px]" />
          <span className="text-[22px] font-bold tracking-[-0.02em]">Mi Cuadre</span>
        </div>

        <nav aria-label="Secciones">
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {SECCIONES.map((s) => {
              const conInsignia = s.ruta === '/prestamos' && vencidos > 0;
              return (
                <li key={s.ruta}>
                  <NavLink
                    to={s.ruta}
                    end={s.ruta === '/'}
                    aria-label={conInsignia ? `${s.etiqueta}, ${vencidos} ${vencidos === 1 ? 'vencido' : 'vencidos'}` : undefined}
                    className={({ isActive }) =>
                      `flex h-12 items-center gap-3 rounded-2xl px-3.5 text-[16px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                        isActive
                          ? 'bg-primary/12 text-primary'
                          : 'text-black/80 hover:bg-black/[0.05] dark:text-white/80 dark:hover:bg-white/[0.08]'
                      }`
                    }
                  >
                    {s.icono}
                    <span className="flex-1">{s.etiqueta}</span>
                    {conInsignia && (
                      <Badge small aria-hidden="true">
                        {vencidos}
                      </Badge>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {perfil && (
          <NavLink
            to="/perfil"
            aria-label={`Tu cuenta: ${perfil.nombre}`}
            className="mt-auto flex items-center gap-3 rounded-2xl bg-black/[0.04] p-3 transition-colors hover:bg-black/[0.07] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:bg-white/[0.07] dark:hover:bg-white/[0.11]"
          >
            <AvatarUsuario nombre={perfil.nombre} fotoUrl={perfil.fotoUrl} className="size-10 text-[15px]" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-semibold">{perfil.nombre}</span>
              <span className="block truncate text-[13px] text-secundario">{perfil.correo}</span>
            </span>
          </NavLink>
        )}
      </SuperficieVidrio>
    </aside>
  );
}
