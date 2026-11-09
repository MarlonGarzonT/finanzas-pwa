import { Block, Button } from 'konsta/react';
import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface Estado {
  fallo: boolean;
}

// Si una pantalla revienta al renderizar, se muestra esto en vez de dejar la
// app en blanco; "Reintentar" recarga, que también trae el JS más reciente
// si el error vino de un deploy a medias.
export class LimiteDeError extends Component<Props, Estado> {
  state: Estado = { fallo: false };

  static getDerivedStateFromError(): Estado {
    return { fallo: true };
  }

  render() {
    if (!this.state.fallo) return this.props.children;
    return (
      <Block className="flex flex-1 flex-col items-center justify-center gap-3 text-center" role="alert">
        <p className="text-[17px] font-semibold">Algo salió mal al mostrar esta pantalla.</p>
        <p className="text-[15px] text-secundario">Tus datos están a salvo. Vuelve a cargar para seguir.</p>
        <Button large rounded inline className="mt-2 px-8" onClick={() => window.location.reload()}>
          Reintentar
        </Button>
      </Block>
    );
  }
}
