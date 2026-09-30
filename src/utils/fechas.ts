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

// Versión compacta para ejes de gráfico y espacios reducidos (ej. "oct 2026").
export function nombreMesCorto(fecha: Date): string {
  return fecha.toLocaleDateString('es-CO', { month: 'short', year: 'numeric' });
}

export function claveMes(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function claveMesDeFecha(fecha: Date): string {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
}

export function sumarMeses(fecha: Date, delta: number): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth() + delta, 1);
}

// Un movimiento nuevo debe quedar en el mes que el usuario tiene seleccionado
// (no en el mes real de hoy). Se conserva el día/hora actual, ajustando el
// día si el mes seleccionado tiene menos días (ej. 31 en un mes de 30).
export function fechaEnMesSeleccionado(mesSeleccionado: Date, ahora: Date = new Date()): Date {
  const diasEnMes = new Date(mesSeleccionado.getFullYear(), mesSeleccionado.getMonth() + 1, 0).getDate();
  const dia = Math.min(ahora.getDate(), diasEnMes);
  return new Date(
    mesSeleccionado.getFullYear(),
    mesSeleccionado.getMonth(),
    dia,
    ahora.getHours(),
    ahora.getMinutes(),
    ahora.getSeconds(),
    ahora.getMilliseconds()
  );
}
