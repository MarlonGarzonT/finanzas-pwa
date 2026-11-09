interface Props {
  emoji: string;
  color: string;
}

// Círculo con el emoji de la categoría sobre un tinte de su color. El emoji
// es contenido elegido por la persona (identidad de la categoría), no un
// ícono de interfaz; por eso queda oculto al lector de pantalla.
export function AvatarEmoji({ emoji, color }: Props) {
  return (
    <span
      className="flex size-10 shrink-0 items-center justify-center rounded-full text-xl"
      style={{ background: `color-mix(in srgb, ${color} 22%, transparent)` }}
      aria-hidden="true"
    >
      {emoji}
    </span>
  );
}
