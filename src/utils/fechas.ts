export function calcularSemanaDelMes(fecha: Date): number {
  return Math.ceil(fecha.getDate() / 7);
}

export function formatearFecha(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatearMonto(monto: number): string {
  return `$${monto.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`;
}

export function nombreMes(fecha: Date): string {
  return fecha.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
}

export function claveMes(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
