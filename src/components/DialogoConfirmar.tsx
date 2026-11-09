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
          <DialogButton strong className="text-alerta" onClick={onConfirmar}>
            {textoConfirmar}
          </DialogButton>
        </>
      }
    />,
    destino
  );
}
