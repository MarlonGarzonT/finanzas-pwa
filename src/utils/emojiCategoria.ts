const EMOJI_POR_PALABRA_CLAVE: [RegExp, string][] = [
  [/comida|almuerzo|restaurante|mercado|super|desayuno|cena/i, '🍔'],
  [/transporte|uber|taxi|gasolina|parqueadero|bus|metro/i, '🚗'],
  [/vivienda|arriendo|hipoteca|renta|casa/i, '🏠'],
  [/salud|droguer|farmacia|m[eé]dico|vitamina|eps/i, '💊'],
  [/entretenimiento|cine|streaming|netflix|juego|salida/i, '🎮'],
  [/servicio|luz|agua|internet|gas|tel[eé]fono|energ[ií]a/i, '💡'],
  [/salario|n[oó]mina|sueldo|pago/i, '💰'],
  [/ropa|tienda|compra/i, '🛍️'],
  [/mascota|perro|gato|veterinar/i, '🐶'],
  [/viaje|vuelo|hotel|vacacion/i, '✈️'],
  [/educaci[oó]n|colegio|universidad|curso/i, '🎓'],
];

const EMOJIS_RESPALDO = ['🏷️', '📦', '🧾', '⭐', '🔖', '🎯'];

// Se usa una sola vez, al crear la categoría, y el resultado queda guardado
// en base de datos: el emoji es predeterminado, el usuario no lo elige.
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
