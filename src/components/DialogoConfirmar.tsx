import { Dialog, DialogButton } from 'konsta/react';
import { createPortal } from 'react-dom';

interface Props {
  abierto: boolean;
  titulo: string;
  mensaje: string;
  textoConfirmar: string;
  onConfirmar: () => void;
  onCancelar: () => void;
}

// En iOS 26 el botón principal del diálogo de Konsta va relleno del azul de
// acento; para una acción destructiva el relleno es coral con texto blanco,
// como "Eliminar" en iOS. (DialogButton reenvía `colors` al Button interno
// aunque su tipo no lo declare; por eso va como spread.)
const COLORES_DESTRUCTIVOS = {
  colors: { fillBgIos: 'bg-[var(--alerta-boton)]', fillTextIos: 'text-white' },
};

// Alerta de confirmación estilo iOS para acciones destructivas. Siempre
// en portal: puede abrirse desde dentro de una hoja inferior.
export function DialogoConfirmar({ abierto, titulo, mensaje, textoConfirmar, onConfirmar, onCancelar }: Props) {
  const destino = document.getElementById('capa-hojas') ?? document.body;
  return createPortal(
    <Dialog
      opened={abierto}
      onBackdropClick={onCancelar}
      title={titulo}
      content={mensaje}
      className="z-50"
      role="alertdialog"
      aria-modal="true"
      buttons={
        <>
          <DialogButton onClick={onCancelar}>Cancelar</DialogButton>
          <DialogButton strong {...COLORES_DESTRUCTIVOS} onClick={onConfirmar}>
            {textoConfirmar}
          </DialogButton>
        </>
      }
    />,
    destino
  );
}
