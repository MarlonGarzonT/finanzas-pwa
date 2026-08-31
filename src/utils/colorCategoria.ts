const PALETA = [
  'var(--color-sky)',
  'var(--color-orange)',
  'var(--color-purple)',
  'var(--color-teal)',
  'var(--color-pink)',
  'var(--color-indigo)',
  'var(--color-yellow)',
  'var(--color-brown)',
];

export function colorCategoria(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return PALETA[hash % PALETA.length];
}
