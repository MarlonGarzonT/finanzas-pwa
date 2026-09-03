import './SelectorEmoji.css';

const EMOJIS_DISPONIBLES = [
  '🍔', '🍕', '☕', '🛒', '🚗', '🚌', '⛽', '🏠',
  '💡', '📶', '💊', '🏥', '🎮', '🎬', '🎵', '📚',
  '👕', '🛍️', '✈️', '🏋️', '🐶', '👶', '🎁', '💰',
  '💳', '📈', '🧾', '🔧', '🎓', '🍺', '⚽', '🏷️',
];

interface Props {
  seleccionado: string | null;
  onSeleccionar: (emoji: string) => void;
}

export function SelectorEmoji({ seleccionado, onSeleccionar }: Props) {
  return (
    <div className="selector-emoji" role="radiogroup" aria-label="Elige un emoji para la categoría">
      {EMOJIS_DISPONIBLES.map((emoji) => (
        <button
          key={emoji}
          type="button"
          role="radio"
          aria-checked={seleccionado === emoji}
          className={`selector-emoji__opcion ${seleccionado === emoji ? 'selector-emoji__opcion--activa' : ''}`}
          onClick={() => onSeleccionar(emoji)}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
