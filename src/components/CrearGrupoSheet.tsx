import { Block, Button, List } from 'konsta/react';
import { useState } from 'react';
import { useGrupos } from '../data/GruposContext';
import type { Grupo } from '../types';
import { CampoTexto } from './CampoTexto';
import { HojaInferior } from './HojaInferior';
import { IconoCheck, IconoCompartir, IconoCopiar } from './Iconos';
import { NOMBRE_VISIBLE_STORAGE_KEY, sugerenciaNombreVisible } from './nombreVisible';

interface Props {
  abierto: boolean;
  onCerrar: () => void;
  onCreado: (grupo: Grupo) => void;
}

export function CrearGrupoSheet({ abierto, onCerrar, onCreado }: Props) {
  const { crearGrupo } = useGrupos();
  const [nombre, setNombre] = useState('');
  const [nombreVisible, setNombreVisible] = useState(sugerenciaNombreVisible);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [grupoCreado, setGrupoCreado] = useState<Grupo | null>(null);
  const [copiado, setCopiado] = useState(false);

  function cerrarYLimpiar() {
    onCerrar();
    if (grupoCreado) onCreado(grupoCreado);
    setNombre('');
    setGrupoCreado(null);
    setCopiado(false);
    setError(null);
  }

  async function manejarCrear() {
    const limpio = nombre.trim();
    const nombreVisibleLimpio = nombreVisible.trim();
    if (!limpio || !nombreVisibleLimpio) return;
    setGuardando(true);
    setError(null);
    try {
      const nuevo = await crearGrupo(limpio, nombreVisibleLimpio);
      try {
        localStorage.setItem(NOMBRE_VISIBLE_STORAGE_KEY, nombreVisibleLimpio);
      } catch {
        // Sin almacenamiento local (modo privado): solo se pierde la sugerencia.
      }
      setGrupoCreado(nuevo);
    } catch {
      setError('No se pudo crear el grupo. Intenta de nuevo.');
    } finally {
      setGuardando(false);
    }
  }

  async function copiarCodigo() {
    if (!grupoCreado) return;
    try {
      await navigator.clipboard.writeText(grupoCreado.codigo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch {
      setError('No se pudo copiar. Mantén presionado el código para copiarlo.');
    }
  }

  async function compartirCodigo() {
    if (!grupoCreado) return;
    const texto = `Únete a mi grupo "${grupoCreado.nombre}" en Mis Finanzas con el código: ${grupoCreado.codigo}`;
    if (navigator.share) {
      try {
        await navigator.share({ text: texto });
      } catch {
        // la persona canceló la hoja de compartir: no hay nada que hacer
      }
    } else {
      await copiarCodigo();
    }
  }

  const errorVisible = error && (
    <p className="m-0 text-center text-[15px] text-alerta" role="alert">
      {error}
    </p>
  );

  return (
    <HojaInferior
      abierto={abierto}
      titulo={grupoCreado ? 'Grupo creado' : 'Nuevo grupo'}
      onCerrar={cerrarYLimpiar}
      textoCerrar={grupoCreado ? 'Listo' : 'Cancelar'}
      cierreBloqueado={guardando}
      pie={
        grupoCreado ? (
          <>
            {errorVisible}
            <Button large rounded onClick={compartirCodigo} className="gap-2">
              <IconoCompartir className="size-5" />
              Compartir código
            </Button>
            <Button large rounded clear onClick={copiarCodigo} className="gap-2">
              {copiado ? <IconoCheck className="size-5" /> : <IconoCopiar className="size-5" />}
              {copiado ? 'Copiado' : 'Copiar código'}
            </Button>
          </>
        ) : (
          <>
            {errorVisible}
            <Button large rounded onClick={manejarCrear} disabled={guardando || !nombre.trim() || !nombreVisible.trim()}>
              {guardando ? 'Creando…' : 'Crear grupo'}
            </Button>
          </>
        )
      }
    >
      {!grupoCreado ? (
        <List strong inset className="my-2">
          <CampoTexto
            etiqueta="Nombre del grupo"
            valor={nombre}
            onCambiar={setNombre}
            placeholder="Viaje a la playa"
            enterKeyHint="next"
            autoFocus
          />
          <CampoTexto
            etiqueta="Tu nombre en el grupo"
            valor={nombreVisible}
            onCambiar={setNombreVisible}
            placeholder="Cómo te verán los demás"
            autoComplete="given-name"
            autoCapitalize="words"
          />
        </List>
      ) : (
        <Block className="my-4 flex flex-col items-center gap-4 text-center">
          <p className="m-0 text-[15px] text-secundario">
            Comparte este código con quienes quieras sumar. Lo usan para unirse desde su propia cuenta.
          </p>
          <p
            className="m-0 rounded-2xl bg-ios-light-surface-1 px-7 py-3 text-[34px] font-bold tracking-[0.2em] select-all cifras dark:bg-ios-dark-surface-1"
            aria-label={`Código ${grupoCreado.codigo.split('').join(' ')}`}
          >
            {grupoCreado.codigo}
          </p>
        </Block>
      )}
    </HojaInferior>
  );
}
