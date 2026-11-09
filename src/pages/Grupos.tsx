import { Actions, ActionsButton, ActionsGroup, Block, Button, Fab, List, ListItem, Navbar, Page } from 'konsta/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AvatarMiembro } from '../components/AvatarMiembro';
import { Cargando } from '../components/Cargando';
import { CrearGrupoSheet } from '../components/CrearGrupoSheet';
import { IconoMas } from '../components/Iconos';
import { UnirseGrupoSheet } from '../components/UnirseGrupoSheet';
import { useGrupos } from '../data/GruposContext';
import type { Grupo } from '../types';

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
    <Page className="pagina-con-fab">
      <Navbar centerTitle title="Grupos" />

      {cargando ? (
        <Cargando />
      ) : grupos.length === 0 ? (
        <Block className="flex flex-col items-center gap-4 pt-6 text-center">
          <p className="m-0 max-w-72 text-[17px] text-secundario">
            Divide gastos con amigos o familia: cada quien registra lo que pagó y la app calcula quién le debe a quién.
          </p>
          <div className="flex w-full max-w-72 flex-col gap-2">
            <Button large rounded onClick={() => setCrearAbierto(true)}>
              Crear grupo
            </Button>
            <Button large rounded tonal onClick={() => setUnirseAbierto(true)}>
              Unirme con un código
            </Button>
          </div>
        </Block>
      ) : (
        <List strong inset dividers className="aparecer-suave">
          {grupos.map((g) => (
            <ListItem
              key={g.id}
              link
              linkComponent="button"
              linkProps={{ type: 'button' }}
              onClick={() => irAGrupo(g)}
              media={<AvatarMiembro id={g.id} nombre={g.nombre} />}
              title={g.nombre}
              contentClassName="w-full text-left"
            />
          ))}
        </List>
      )}

      {grupos.length > 0 && (
        <Fab
          className="fab-sobre-pestanas fixed right-4 z-20 size-14"
          icon={<IconoMas className="size-7" />}
          onClick={() => setMenuAbierto(true)}
          aria-label="Crear o unirse a un grupo"
        />
      )}

      <Actions opened={menuAbierto} onBackdropClick={() => setMenuAbierto(false)}>
        <ActionsGroup>
          <ActionsButton
            onClick={() => {
              setMenuAbierto(false);
              setCrearAbierto(true);
            }}
          >
            Crear grupo
          </ActionsButton>
          <ActionsButton
            onClick={() => {
              setMenuAbierto(false);
              setUnirseAbierto(true);
            }}
          >
            Unirme con un código
          </ActionsButton>
        </ActionsGroup>
        <ActionsGroup>
          <ActionsButton bold onClick={() => setMenuAbierto(false)}>
            Cancelar
          </ActionsButton>
        </ActionsGroup>
      </Actions>

      <CrearGrupoSheet abierto={crearAbierto} onCerrar={() => setCrearAbierto(false)} onCreado={irAGrupo} />
      <UnirseGrupoSheet abierto={unirseAbierto} onCerrar={() => setUnirseAbierto(false)} onUnido={irAGrupo} />
    </Page>
  );
}
