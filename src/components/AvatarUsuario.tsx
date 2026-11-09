import { useState } from 'react';

interface Props {
  nombre: string;
  fotoUrl: string | null;
  className?: string;
}

function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  return ((partes[0]?.[0] ?? '') + (partes.length > 1 ? partes[partes.length - 1][0] : '')).toUpperCase() || '?';
}

// Foto de la cuenta de Google o, si no hay (cuenta de correo) o no carga,
// las iniciales sobre el azul de acento. referrerPolicy no-referrer: las
// fotos de googleusercontent a veces responden 403 si llevan referer.
export function AvatarUsuario({ nombre, fotoUrl, className = 'size-24 text-3xl' }: Props) {
  const [fotoFallo, setFotoFallo] = useState(false);

  if (fotoUrl && !fotoFallo) {
    return (
      <img
        src={fotoUrl}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setFotoFallo(true)}
        className={`shrink-0 rounded-full object-cover ring-1 ring-black/10 dark:ring-white/15 ${className}`}
      />
    );
  }

  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-white ${className}`}
      aria-hidden="true"
    >
      {iniciales(nombre)}
    </span>
  );
}
