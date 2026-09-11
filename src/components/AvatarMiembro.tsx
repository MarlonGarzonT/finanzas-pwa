import { colorCategoria } from '../utils/colorCategoria';
import './AvatarMiembro.css';

interface Props {
  id: string;
  nombre: string;
}

export function AvatarMiembro({ id, nombre }: Props) {
  return (
    <span className="avatar-miembro" style={{ background: colorCategoria(id) }} aria-hidden>
      {nombre.slice(0, 1).toUpperCase()}
    </span>
  );
}
