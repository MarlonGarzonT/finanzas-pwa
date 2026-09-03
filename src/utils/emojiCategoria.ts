const EMOJI_POR_PALABRA_CLAVE: [RegExp, string][] = [
  [/comida|almuerzo|restaurante|mercado|super|desayuno|cena/i, '🍔'],
  [/transporte|uber|taxi|gasolina|parqueadero|bus|metro/i, '🚗'],
  [/vivienda|arriendo|hipoteca|renta|casa/i, '🏠'],
  [/salud|droguer|farmacia|m[eé]dico|vitamina|eps/i, '💊'],
  [/entretenimiento|cine|streaming|netflix|juego|salida/i, '🎮'],
  [/servicio|luz|agua|internet|gas|tel[eé]fono|energ[ií]a/i, '💡'],
  [/salario|n[oó]mina|sueldo|pago/i, '💰'],
  [/ropa|tienda|compra/i, '🛍️'],
];

const EMOJIS_RESPALDO = ['🏷️', '📦', '🧾', '⭐', '🔖', '🎯'];

// Palabra clave primero (categorías por defecto y variantes comunes);
// si no coincide con nada, se elige un emoji de respaldo estable por
// nombre, para que una misma categoría personalizada luzca siempre igual.
export function emojiCategoria(nombre: string): string {
  for (const [patron, emoji] of EMOJI_POR_PALABRA_CLAVE) {
    if (patron.test(nombre)) return emoji;
  }
  let hash = 0;
  for (let i = 0; i < nombre.length; i++) {
    hash = (hash * 31 + nombre.charCodeAt(i)) >>> 0;
  }
  return EMOJIS_RESPALDO[hash % EMOJIS_RESPALDO.length];
}
