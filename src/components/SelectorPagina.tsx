import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import './SelectorPagina.css';

const PAGINAS = [
  { to: '/', etiqueta: 'Resumen' },
  { to: '/historial', etiqueta: 'Historial' },
];

export function SelectorPagina() {
  const [abierto, setAbierto] = useState(false);
  const { pathname } = useLocation();
  const actual = PAGINAS.find((p) => p.to === pathname) ?? PAGINAS[0];

  return (
    <div className="selector-pagina">
      <button
        type="button"
        className="selector-pagina__boton"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
      >
        {actual.etiqueta}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {abierto && (
        <>
          <div className="selector-pagina__fondo" onClick={() => setAbierto(false)} />
          <div className="selector-pagina__menu">
            {PAGINAS.map((p) => (
              <NavLink
                key={p.to}
                to={p.to}
                end={p.to === '/'}
                className={({ isActive }) =>
                  `selector-pagina__opcion ${isActive ? 'selector-pagina__opcion--activa' : ''}`
                }
                onClick={() => setAbierto(false)}
              >
                {p.etiqueta}
              </NavLink>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
