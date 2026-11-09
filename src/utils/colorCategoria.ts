const PALETA = [
  'var(--categoria-azul)',
  'var(--categoria-naranja)',
  'var(--categoria-morado)',
  'var(--categoria-cian)',
  'var(--categoria-rosa)',
  'var(--categoria-menta)',
  'var(--categoria-amarillo)',
  'var(--categoria-cafe)',
];

export function colorCategoria(id: string | null | undefined): string {
  const clave = id ?? '';
  let hash = 0;
  for (let i = 0; i < clave.length; i++) {
    hash = (hash * 31 + clave.charCodeAt(i)) >>> 0;
  }
  return PALETA[hash % PALETA.length];
}
