import { Button, List } from 'konsta/react';
import { useState } from 'react';
import { useGrupos } from '../data/GruposContext';
import type { Grupo } from '../types';
import { CampoTexto } from './CampoTexto';
import { HojaInferior } from './HojaInferior';
import { NOMBRE_VISIBLE_STORAGE_KEY, sugerenciaNombreVisible } from './nombreVisible';

interface Props {
  abierto: boolean;
  onCerrar: () => void;
  onUnido: (grupo: Grupo) => void;
}

export function UnirseGrupoSheet({ abierto, onCerrar, onUnido }: Props) {
  const { unirseAGrupo } = useGrupos();
  const [codigo, setCodigo] = useState('');
  const [nombreVisible, setNombreVisible] = useState(sugerenciaNombreVisible);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function manejarUnirse() {
    const codigoLimpio = codigo.trim();
    const nombreVisibleLimpio = nombreVisible.trim();
    if (!codigoLimpio || !nombreVisibleLimpio) return;
    setGuardando(true);
    setError(null);
    try {
      const grupo = await unirseAGrupo(codigoLimpio, nombreVisibleLimpio);
      try {
        localStorage.setItem(NOMBRE_VISIBLE_STORAGE_KEY, nombreVisibleLimpio);
      } catch {
        // Sin almacenamiento local (modo privado): solo se pierde la sugerencia.
      }
      setCodigo('');
      onCerrar();
      onUnido(grupo);
    } catch {
      setError('Ese código no existe. Revísalo e intenta de nuevo.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <HojaInferior
      abierto={abierto}
      titulo="Unirme a un grupo"
      onCerrar={onCerrar}
      cierreBloqueado={guardando}
      pie={
        <>
          {error && (
            <p className="m-0 text-center text-[15px] text-alerta" role="alert">
              {error}
            </p>
          )}
          <Button large rounded onClick={manejarUnirse} disabled={guardando || !codigo.trim() || !nombreVisible.trim()}>
            {guardando ? 'Uniéndome…' : 'Unirme'}
          </Button>
        </>
      }
    >
      <List strong inset className="my-2">
        <CampoTexto
          etiqueta="Código de invitación"
          valor={codigo}
          onCambiar={(v) => setCodigo(v.toUpperCase())}
          placeholder="ABC123"
          autoCapitalize="characters"
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
    </HojaInferior>
  );
}
