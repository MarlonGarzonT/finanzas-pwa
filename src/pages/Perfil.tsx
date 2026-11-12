import { BlockFooter, BlockTitle, List, ListItem, Navbar, Page, Preloader } from 'konsta/react';
import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { CabeceraPerfil } from '../components/CabeceraPerfil';
import { Cargando } from '../components/Cargando';
import { ConstanciaMeses } from '../components/ConstanciaMeses';
import { DialogoConfirmar } from '../components/DialogoConfirmar';
import { GastosAnualesSheet } from '../components/GastosAnualesSheet';
import { GestionCategorias } from '../components/GestionCategorias';
import { IconoAjuste } from '../components/IconoAjuste';
import { IconoApariencia, IconoCalendario, IconoCorreo, IconoEtiqueta, IconoLlave } from '../components/Iconos';
import { OpcionSelector, SelectorVidrio } from '../components/SelectorVidrio';
import { TarjetaAntiguedad } from '../components/TarjetaAntiguedad';
import { TarjetaExportar } from '../components/TarjetaExportar';
import { useFinanzas } from '../data/FinanzasContext';
import { useExportarExcel } from '../data/useExportarExcel';
import { usePerfil } from '../data/usePerfil';
import { usePreferenciaTema } from '../data/usePreferenciaTema';
import type { PreferenciaTema } from '../utils/tema';

const APARIENCIAS: { valor: PreferenciaTema; etiqueta: string }[] = [
  { valor: 'sistema', etiqueta: 'Automático' },
  { valor: 'claro', etiqueta: 'Claro' },
  { valor: 'oscuro', etiqueta: 'Oscuro' },
];

const FILA = 'w-full text-left';

export function Perfil() {
  const perfil = usePerfil();
  const { cargando, categorias, gastosAnuales, crearCategoria, actualizarCategoria, eliminarCategoria } = useFinanzas();
  const { cerrarSesion, restablecerPassword } = useAuth();
  const [tema, setTema] = usePreferenciaTema();
  const excel = useExportarExcel();
  const [categoriasAbierto, setCategoriasAbierto] = useState(false);
  const [gastosAnualesAbierto, setGastosAnualesAbierto] = useState(false);
  const [confirmandoSalida, setConfirmandoSalida] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);
  const [enviandoCorreo, setEnviandoCorreo] = useState(false);

  async function cambiarPassword() {
    if (!perfil) return;
    setEnviandoCorreo(true);
    setAviso(null);
    try {
      const { error } = await restablecerPassword(perfil.correo);
      setAviso(
        error
          ? { tipo: 'error', texto: 'No se pudo enviar el correo. Intenta de nuevo en unos minutos.' }
          : { tipo: 'exito', texto: `Te enviamos un correo a ${perfil.correo} para elegir una contraseña nueva.` }
      );
    } catch {
      setAviso({ tipo: 'error', texto: 'No hay conexión. Revisa tu internet e intenta de nuevo.' });
    } finally {
      setEnviandoCorreo(false);
    }
  }

  return (
    <Page className="pagina-con-pestanas">
      <Navbar centerTitle title="Perfil" />

      {cargando || !perfil ? (
        <Cargando />
      ) : (
        <>
          <CabeceraPerfil perfil={perfil} />

          <TarjetaAntiguedad antiguedad={perfil.antiguedad} desde={perfil.miembroDesde} />

          <BlockTitle>Tu constancia</BlockTitle>
          <ConstanciaMeses
            constancia={perfil.constancia}
            racha={perfil.racha}
            movimientos={perfil.movimientos}
            mesesRegistrados={perfil.mesesRegistrados}
          />

          <BlockTitle>Preferencias</BlockTitle>
          <List strong inset>
            <ListItem
              media={
                <IconoAjuste color="#8e8e93">
                  <IconoApariencia className="size-[18px]" />
                </IconoAjuste>
              }
              title="Apariencia"
              mediaClassName="self-start"
              footer={
                <SelectorVidrio className="mt-2.5 mb-1">
                  {APARIENCIAS.map((a) => (
                    <OpcionSelector key={a.valor} active={tema === a.valor} onClick={() => setTema(a.valor)}>
                      {a.etiqueta}
                    </OpcionSelector>
                  ))}
                </SelectorVidrio>
              }
            />
            <ListItem
              link
              linkComponent="button"
              linkProps={{ type: 'button' }}
              onClick={() => setCategoriasAbierto(true)}
              media={
                <IconoAjuste color="#ff9500">
                  <IconoEtiqueta className="size-[18px]" />
                </IconoAjuste>
              }
              title="Categorías"
              after={String(categorias.length)}
              contentClassName={FILA}
            />
          </List>

          <BlockTitle>Tus datos</BlockTitle>
          <List strong inset>
            <ListItem
              link
              linkComponent="button"
              linkProps={{ type: 'button' }}
              onClick={() => setGastosAnualesAbierto(true)}
              media={
                <IconoAjuste color="#ff3b30">
                  <IconoCalendario className="size-[18px]" />
                </IconoAjuste>
              }
              title="Gastos del año"
              after={gastosAnuales.length > 0 ? String(gastosAnuales.length) : undefined}
              contentClassName={FILA}
            />
          </List>
          <TarjetaExportar excel={excel} movimientos={perfil.movimientos} />
          {excel.error && (
            <BlockFooter className="text-alerta" role="alert">
              {excel.error}
            </BlockFooter>
          )}

          <BlockTitle>Cuenta</BlockTitle>
          <List strong inset>
            <ListItem
              media={
                <IconoAjuste color="#007aff">
                  <IconoCorreo className="size-[18px]" />
                </IconoAjuste>
              }
              title="Correo"
              after={<span className="max-w-[55vw] truncate">{perfil.correo}</span>}
            />
            {perfil.metodo === 'correo' && (
              <ListItem
                link
                chevron={!enviandoCorreo}
                linkComponent="button"
                linkProps={{ type: 'button', disabled: enviandoCorreo }}
                onClick={cambiarPassword}
                media={
                  <IconoAjuste color="#8e8e93">
                    <IconoLlave className="size-[18px]" />
                  </IconoAjuste>
                }
                title="Cambiar contraseña"
                after={enviandoCorreo ? <Preloader className="size-5" /> : undefined}
                contentClassName={FILA}
              />
            )}
            <ListItem
              link
              chevron={false}
              linkComponent="button"
              linkProps={{ type: 'button' }}
              onClick={() => setConfirmandoSalida(true)}
              title={<span className="block w-full text-center font-medium text-alerta">Cerrar sesión</span>}
              contentClassName="w-full [&_.shrink]:flex-1"
            />
          </List>
          {aviso && (
            <BlockFooter className={aviso.tipo === 'error' ? 'text-alerta' : 'text-ingreso'} role={aviso.tipo === 'error' ? 'alert' : 'status'}>
              {aviso.texto}
            </BlockFooter>
          )}

          <p className="m-0 mt-8 text-center text-[13px] text-secundario cifras">
            Mi Cuadre · versión {__VERSION_APP__}
          </p>
        </>
      )}

      <GestionCategorias
        abierto={categoriasAbierto}
        categorias={categorias}
        onCerrar={() => setCategoriasAbierto(false)}
        onCrear={async (nombre, tipo) => {
          await crearCategoria(nombre, tipo);
        }}
        onActualizar={actualizarCategoria}
        onEliminar={eliminarCategoria}
      />

      <GastosAnualesSheet abierto={gastosAnualesAbierto} onCerrar={() => setGastosAnualesAbierto(false)} />

      <DialogoConfirmar
        abierto={confirmandoSalida}
        titulo="¿Cerrar sesión?"
        mensaje="Tus datos quedan guardados en tu cuenta. Vuelves a verlos al iniciar sesión."
        textoConfirmar="Cerrar sesión"
        onConfirmar={() => {
          setConfirmandoSalida(false);
          cerrarSesion();
        }}
        onCancelar={() => setConfirmandoSalida(false)}
      />
    </Page>
  );
}
