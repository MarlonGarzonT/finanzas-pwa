const PALETA = [
  'var(--color-sky)',
  'var(--warning)',
  'var(--color-purple)',
  'var(--color-teal)',
  'var(--color-pink)',
  'var(--color-turquoise)',
  'var(--color-yellow)',
  'var(--color-brown)',
];

export function colorCategoria(id: string | null | undefined): string {
  const clave = id ?? '';
  let hash = 0;
  for (let i = 0; i < clave.length; i++) {
    hash = (hash * 31 + clave.charCodeAt(i)) >>> 0;
  }
  return PALETA[hash % PALETA.length];
}
