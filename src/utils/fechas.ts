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
  if (monto < 0) return `−${formatearMonto(Math.abs(monto))}`;
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

// text-transform:capitalize pondría mayúscula en cada palabra ("Septiembre
// De 2026"); esto solo capitaliza la primera letra ("Septiembre de 2026").
export function capitalizarPrimera(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
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

// Nombre de un mes sin año a partir de su número (1 = "enero").
export function nombreMesDelAnio(mes: number): string {
  return new Date(2000, mes - 1, 1).toLocaleDateString('es-CO', { month: 'long' });
}

// Versión compacta para ejes de gráfico y espacios reducidos (ej. "oct 2026").
export function nombreMesCorto(fecha: Date): string {
  return fecha.toLocaleDateString('es-CO', { month: 'short', year: 'numeric' });
}

// 'AAAA-MM-DD' del día local (no UTC): el 9 de noviembre a las 9 p. m. en
// Colombia sigue siendo el 9, aunque en UTC ya sea el 10.
export function fechaLocalISO(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

// Medianoche local de un 'AAAA-MM-DD'. new Date('2026-11-05') la tomaría en
// UTC y en Colombia daría el 4 a las 7 p. m.
export function fechaDesdeISO(iso: string): Date {
  const [anio, mes, dia] = iso.split('-').map(Number);
  return new Date(anio, mes - 1, dia);
}

// El día que eligió la persona ('AAAA-MM-DD') con la hora de `hora`. Al crear
// se usa la hora actual y al editar la original: así, entre movimientos del
// mismo día, el último que se registró queda primero.
export function fechaConHora(dia: string, hora: Date): Date {
  const base = fechaDesdeISO(dia);
  return new Date(
    base.getFullYear(),
    base.getMonth(),
    base.getDate(),
    hora.getHours(),
    hora.getMinutes(),
    hora.getSeconds(),
    hora.getMilliseconds()
  );
}

// Fecha con la que arranca el formulario de un movimiento nuevo, en el mes que
// la persona tiene elegido (no necesariamente el de hoy). Se conserva el día y
// la hora actuales, ajustando el día si el mes tiene menos días (31 → 30).
// En un mes futuro arranca el día 1: copiar el día de hoy dejaba fechas como
// el 30 de noviembre para algo anotado el 31 de octubre, y esos movimientos
// salían como los más recientes. La fecha queda a la vista para cambiarla.
export function fechaEnMesSeleccionado(mesSeleccionado: Date, ahora: Date = new Date()): Date {
  const diasEnMes = new Date(mesSeleccionado.getFullYear(), mesSeleccionado.getMonth() + 1, 0).getDate();
  const esFuturo =
    mesSeleccionado.getFullYear() * 12 + mesSeleccionado.getMonth() > ahora.getFullYear() * 12 + ahora.getMonth();
  const dia = esFuturo ? 1 : Math.min(ahora.getDate(), diasEnMes);
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
