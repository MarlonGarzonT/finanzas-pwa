import { Block, BlockTitle, Button, Fab, List, ListItem, Navbar, NavbarBackLink, Page } from 'konsta/react';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { AvatarMiembro } from '../components/AvatarMiembro';
import { Cargando } from '../components/Cargando';
import { DialogoConfirmar } from '../components/DialogoConfirmar';
import { IconoMas, IconoPapelera } from '../components/Iconos';
import { NuevoGastoGrupoSheet } from '../components/NuevoGastoGrupoSheet';
import { RegistrarPagoSheet } from '../components/RegistrarPagoSheet';
import { useGrupos } from '../data/GruposContext';
import { useGrupoDetalle } from '../data/useGrupoDetalle';
import type { GastoGrupo } from '../types';
import { formatearFechaCorta, formatearMonto } from '../utils/fechas';
import { calcularBalances, simplificarDeudas, type DeudaSugerida } from '../utils/saldosGrupo';

export function GrupoDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { session } = useAuth();
  const miId = session?.user.id;
  const { grupos } = useGrupos();
  const { miembros, gastos, partes, pagos, cargando, agregarGasto, eliminarGasto, registrarPago } = useGrupoDetalle(id);
  const [gastoAbierto, setGastoAbierto] = useState(false);
  const [pagoSugerido, setPagoSugerido] = useState<DeudaSugerida | null>(null);
  const [gastoAEliminar, setGastoAEliminar] = useState<GastoGrupo | null>(null);
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null);

  const grupo = grupos.find((g) => g.id === id);

  const nombreDe = useMemo(() => {
    const mapa = new Map(miembros.map((m) => [m.userId, m.nombreVisible]));
    return (userId: string) => (userId === miId ? 'Tú' : (mapa.get(userId) ?? 'Alguien'));
  }, [miembros, miId]);

  const balances = useMemo(() => calcularBalances(gastos, partes, pagos), [gastos, partes, pagos]);
  const deudas = useMemo(() => simplificarDeudas(balances), [balances]);

  const partesPorGasto = useMemo(() => {
    const mapa = new Map<string, typeof partes>();
    for (const parte of partes) {
      const lista = mapa.get(parte.gastoId) ?? [];
      lista.push(parte);
      mapa.set(parte.gastoId, lista);
    }
    return mapa;
  }, [partes]);

  async function confirmarEliminarGasto() {
    if (!gastoAEliminar) return;
    const gasto = gastoAEliminar;
    setGastoAEliminar(null);
    setErrorEliminar(null);
    try {
      await eliminarGasto(gasto.id);
    } catch {
      setErrorEliminar(`No se pudo eliminar “${gasto.descripcion}”. Intenta de nuevo.`);
    }
  }

  function textoDeuda(d: DeudaSugerida) {
    if (d.de === miId) return `Le debes a ${nombreDe(d.a)}`;
    if (d.a === miId) return `${nombreDe(d.de)} te debe`;
    return `${nombreDe(d.de)} le debe a ${nombreDe(d.a)}`;
  }

  return (
    <Page className="pb-[calc(var(--k-safe-area-bottom)+168px)]">
      <Navbar
        centerTitle
        title={grupo?.nombre ?? 'Grupo'}
        left={<NavbarBackLink text="Grupos" showText onClick={() => navigate('/grupos')} />}
      />

      {cargando ? (
        <Cargando />
      ) : (
        <div className="aparecer-suave">
          <ul className="m-0 flex list-none gap-4 overflow-x-auto px-4 pt-4 pb-1 [scrollbar-width:none]" aria-label="Miembros">
            {miembros.map((m) => (
              <li key={m.userId} className="flex w-14 shrink-0 flex-col items-center gap-1">
                <AvatarMiembro id={m.userId} nombre={m.nombreVisible} tamano="lg" />
                <span className="w-full truncate text-center text-[13px] text-secundario">
                  {m.userId === miId ? 'Tú' : m.nombreVisible}
                </span>
              </li>
            ))}
          </ul>

          <BlockTitle>Saldos</BlockTitle>
          <List strong inset dividers>
            {deudas.length === 0 ? (
              <ListItem title={<span className="text-secundario">Todo está saldado. Nadie le debe nada a nadie.</span>} />
            ) : (
              deudas.map((d) => (
                <ListItem
                  key={`${d.de}-${d.a}`}
                  title={textoDeuda(d)}
                  after={<span className="text-[17px] font-semibold text-black dark:text-white cifras">{formatearMonto(d.monto)}</span>}
                  footer={
                    (d.de === miId || d.a === miId) && (
                      <Button rounded tonal inline className="mt-2 h-11 px-5" onClick={() => setPagoSugerido(d)}>
                        Registrar pago
                      </Button>
                    )
                  }
                />
              ))
            )}
          </List>

          <BlockTitle>Gastos</BlockTitle>
          {errorEliminar && (
            <Block className="my-2 text-[15px] text-alerta" role="alert">
              {errorEliminar}
            </Block>
          )}
          <List strong inset dividers>
            {gastos.length === 0 ? (
              <ListItem title={<span className="text-secundario">Aún no hay gastos. Toca + para registrar el primero.</span>} />
            ) : (
              gastos.map((gasto) => {
                const cantidadPartes = partesPorGasto.get(gasto.id)?.length ?? 0;
                return (
                  <ListItem
                    key={gasto.id}
                    media={<AvatarMiembro id={gasto.pagadoPor} nombre={miembros.find((m) => m.userId === gasto.pagadoPor)?.nombreVisible ?? nombreDe(gasto.pagadoPor)} />}
                    title={<span className="block truncate">{gasto.descripcion}</span>}
                    subtitle={
                      <span className="text-secundario">
                        Pagó {nombreDe(gasto.pagadoPor)} · {formatearFechaCorta(gasto.fecha)} · entre {cantidadPartes}
                      </span>
                    }
                    after={
                      <span className="flex items-center gap-1">
                        <span className="text-[17px] font-semibold text-black dark:text-white cifras">{formatearMonto(gasto.monto)}</span>
                        {gasto.creadoPor === miId && (
                          <button
                            type="button"
                            className="-mr-2 flex size-11 items-center justify-center rounded-full text-secundario active:bg-black/10 dark:active:bg-white/15"
                            onClick={() => setGastoAEliminar(gasto)}
                            aria-label={`Eliminar gasto ${gasto.descripcion}`}
                          >
                            <IconoPapelera className="size-5" />
                          </button>
                        )}
                      </span>
                    }
                  />
                );
              })
            )}
          </List>
        </div>
      )}

      <Fab
        className="fixed right-4 bottom-[calc(var(--k-safe-area-bottom)+104px)] z-20 size-14"
        icon={<IconoMas className="size-7" />}
        onClick={() => setGastoAbierto(true)}
        aria-label="Nuevo gasto"
      />

      {id && (
        <NuevoGastoGrupoSheet
          abierto={gastoAbierto}
          grupoId={id}
          miembros={miembros}
          miId={miId ?? ''}
          onCerrar={() => setGastoAbierto(false)}
          onAgregar={agregarGasto}
        />
      )}

      <RegistrarPagoSheet
        abierto={pagoSugerido !== null}
        miembros={miembros}
        miId={miId ?? ''}
        sugerencia={pagoSugerido}
        onCerrar={() => setPagoSugerido(null)}
        onRegistrar={async (de, a, monto) => {
          await registrarPago(de, a, monto);
          setPagoSugerido(null);
        }}
      />

      <DialogoConfirmar
        abierto={gastoAEliminar !== null}
        titulo="¿Eliminar gasto?"
        mensaje={`“${gastoAEliminar?.descripcion ?? ''}” dejará de contar en los saldos del grupo.`}
        textoConfirmar="Eliminar"
        onConfirmar={confirmarEliminarGasto}
        onCancelar={() => setGastoAEliminar(null)}
      />
    </Page>
  );
}
