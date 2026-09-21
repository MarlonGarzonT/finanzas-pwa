import datosPorGrupo from 'unicode-emoji-json/data-by-group.json';

export interface EmojiInfo {
  emoji: string;
  name: string;
  slug: string;
}

export interface GrupoEmojis {
  slug: string;
  etiqueta: string;
  icono: string;
  emojis: EmojiInfo[];
}

// unicode-emoji-json trae los 9 grupos estándar (unicode.org) con nombres en
// inglés; se traducen a español y se elige un emoji representativo para la
// pestaña de cada grupo, al estilo del teclado de emojis de iOS.
const METADATOS_GRUPO: Record<string, { etiqueta: string; icono: string }> = {
  smileys_emotion: { etiqueta: 'Caritas', icono: '😀' },
  people_body: { etiqueta: 'Personas', icono: '👋' },
  animals_nature: { etiqueta: 'Animales', icono: '🐶' },
  food_drink: { etiqueta: 'Comida', icono: '🍔' },
  travel_places: { etiqueta: 'Viajes', icono: '✈️' },
  activities: { etiqueta: 'Actividades', icono: '⚽' },
  objects: { etiqueta: 'Objetos', icono: '💡' },
  symbols: { etiqueta: 'Símbolos', icono: '❤️' },
  flags: { etiqueta: 'Banderas', icono: '🏳️' },
};

export const GRUPOS_EMOJIS: GrupoEmojis[] = (
  datosPorGrupo as { name: string; slug: string; emojis: EmojiInfo[] }[]
).map((grupo) => ({
  slug: grupo.slug,
  etiqueta: METADATOS_GRUPO[grupo.slug]?.etiqueta ?? grupo.name,
  icono: METADATOS_GRUPO[grupo.slug]?.icono ?? grupo.emojis[0]?.emoji ?? '🏷️',
  emojis: grupo.emojis,
}));

export function buscarEmojis(texto: string): EmojiInfo[] {
  const consulta = texto.trim().toLowerCase();
  if (!consulta) return [];
  const resultado: EmojiInfo[] = [];
  for (const grupo of GRUPOS_EMOJIS) {
    for (const e of grupo.emojis) {
      if (e.name.includes(consulta) || e.slug.includes(consulta)) resultado.push(e);
    }
  }
  return resultado;
}
