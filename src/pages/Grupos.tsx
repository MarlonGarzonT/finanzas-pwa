import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CrearGrupoSheet } from '../components/CrearGrupoSheet';
import { SelectorPagina } from '../components/SelectorPagina';
import { Spinner } from '../components/Spinner';
import { UnirseGrupoSheet } from '../components/UnirseGrupoSheet';
import { useGrupos } from '../data/GruposContext';
import type { Grupo } from '../types';
import { colorCategoria } from '../utils/colorCategoria';
import './Grupos.css';

export function Grupos() {
  const { grupos, cargando } = useGrupos();
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [crearAbierto, setCrearAbierto] = useState(false);
  const [unirseAbierto, setUnirseAbierto] = useState(false);

  function irAGrupo(grupo: Grupo) {
    navigate(`/grupos/${grupo.id}`);
  }

  return (
    <div className="grupos">
      <header className="grupos__header">
        <SelectorPagina />
      </header>

      {cargando ? (
        <div className="grupos__cargando">
          <Spinner />
        </div>
      ) : grupos.length === 0 ? (
        <p className="grupos__vacio">
          Aún no tienes grupos. Crea uno para dividir gastos con amigos o únete con un código.
        </p>
      ) : (
        <ul className="grupos__lista">
          {grupos.map((g) => (
            <li key={g.id} className="grupo-fila" onClick={() => irAGrupo(g)}>
              <span className="grupo-fila__avatar" style={{ background: colorCategoria(g.id) }} aria-hidden>
                {g.nombre.slice(0, 1).toUpperCase()}
              </span>
              <span className="grupo-fila__nombre">{g.nombre}</span>
              <span className="grupo-fila__flecha" aria-hidden>
                ›
              </span>
            </li>
          ))}
        </ul>
      )}

      <button className="fab" onClick={() => setMenuAbierto((v) => !v)} aria-label="Crear o unirse a un grupo">
        +
      </button>

      {menuAbierto && (
        <>
          <div className="grupos__fondo-menu" onClick={() => setMenuAbierto(false)} />
          <div className="grupos__menu">
            <button
              type="button"
              onClick={() => {
                setMenuAbierto(false);
                setCrearAbierto(true);
              }}
            >
              🆕 Crear grupo
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuAbierto(false);
                setUnirseAbierto(true);
              }}
            >
              🔗 Unirme con un código
            </button>
          </div>
        </>
      )}

      <CrearGrupoSheet
        abierto={crearAbierto}
        onCerrar={() => setCrearAbierto(false)}
        onCreado={(grupo) => irAGrupo(grupo)}
      />

      <UnirseGrupoSheet
        abierto={unirseAbierto}
        onCerrar={() => setUnirseAbierto(false)}
        onUnido={(grupo) => irAGrupo(grupo)}
      />
    </div>
  );
}
