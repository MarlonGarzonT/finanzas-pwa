export function calcularSemanaDelMes(fecha: Date): number {
  return Math.ceil(fecha.getDate() / 7);
}

export function formatearFecha(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatearFechaCorta(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
}

export function formatearMonto(monto: number): string {
  return `$${monto.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`;
}

// El signo (+/-) nunca depende solo del color: siempre acompaña al monto en texto.
export function formatearMontoConSigno(monto: number): string {
  if (monto > 0) return `+${formatearMonto(monto)}`;
  if (monto < 0) return `-${formatearMonto(Math.abs(monto))}`;
  return formatearMonto(monto);
}

// Para etiquetas de gráfico donde el espacio es reducido (ej. "766k", "1.2M").
export function formatearMontoCompacto(monto: number): string {
  if (monto >= 1_000_000) return `${(monto / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (monto >= 1000) return `${Math.round(monto / 1000)}k`;
  return `${Math.round(monto)}`;
}

export function nombreMes(fecha: Date): string {
  return fecha.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
}

export function claveMes(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
