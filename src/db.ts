import { supabase } from './supabaseClient';
import type {
  CambiosCategoria,
  Categoria,
  GastoAnual,
  Naturaleza,
  NuevaTransaccion,
  NuevoGastoAnual,
  NuevoPrestamo,
  Prestamo,
  Tipo,
  Transaccion,
} from './types';
import { calcularSemanaDelMes } from './utils/fechas';
import { emojiCategoria } from './utils/emojiCategoria';
import { sugerirNaturaleza } from './utils/naturalezaCategoria';

const CATEGORIAS_DEFECTO: { nombre: string; emoji: string; tipo: Tipo; naturaleza: Naturaleza }[] = [
  { nombre: 'Comida', emoji: '🍔', tipo: 'egreso', naturaleza: 'esencial' },
  { nombre: 'Transporte', emoji: '🚗', tipo: 'egreso', naturaleza: 'esencial' },
  { nombre: 'Vivienda', emoji: '🏠', tipo: 'egreso', naturaleza: 'esencial' },
  { nombre: 'Salud', emoji: '💊', tipo: 'egreso', naturaleza: 'esencial' },
  { nombre: 'Entretenimiento', emoji: '🎮', tipo: 'egreso', naturaleza: 'discrecional' },
  { nombre: 'Servicios', emoji: '💡', tipo: 'egreso', naturaleza: 'esencial' },
  { nombre: 'Costos bancarios', emoji: '🏦', tipo: 'egreso', naturaleza: 'discrecional' },
  { nombre: 'Ahorro', emoji: '🐷', tipo: 'egreso', naturaleza: 'ahorro' },
  { nombre: 'Pago tarjeta', emoji: '💳', tipo: 'egreso', naturaleza: 'pago_tarjeta' },
  { nombre: 'Salario', emoji: '💰', tipo: 'ingreso', naturaleza: 'ordinario' },
  { nombre: 'Prima y extras', emoji: '🎁', tipo: 'ingreso', naturaleza: 'extraordinario' },
  { nombre: 'Préstamo o devolución', emoji: '🤝', tipo: 'ingreso', naturaleza: 'prestamo_reembolso' },
  { nombre: 'Otros', emoji: '🏷️', tipo: 'egreso', naturaleza: 'esencial' },
];

function mapCategoria(row: {
  id: string;
  nombre: string;
  emoji: string;
  tipo: Tipo;
  naturaleza: Naturaleza;
  es_fijo: boolean;
}): Categoria {
  return {
    id: row.id,
    nombre: row.nombre,
    emoji: row.emoji,
    tipo: row.tipo,
    naturaleza: row.naturaleza,
    esFijo: row.es_fijo,
  };
}

interface FilaTransaccion {
  id: string;
  fecha: string;
  item: string;
  categoria_id: string;
  tipo: 'ingreso' | 'egreso';
  monto: number;
  prestamo_id: string | null;
}

function mapTransaccion(row: FilaTransaccion): Transaccion {
  return {
    id: row.id,
    fecha: row.fecha,
    item: row.item,
    categoriaId: row.categoria_id,
    tipo: row.tipo,
    monto: Number(row.monto),
    prestamoId: row.prestamo_id ?? null,
  };
}

const COLUMNAS_CATEGORIA = 'id, nombre, emoji, tipo, naturaleza, es_fijo';
// semana_del_mes ya no se lee (C3), pero se sigue escribiendo mientras haya
// teléfonos con la versión anterior, que la exigen al leer.
const COLUMNAS_TRANSACCION = 'id, fecha, item, categoria_id, tipo, monto, prestamo_id';

export async function obtenerCategorias(userId: string): Promise<Categoria[]> {
  const { data, error } = await supabase
    .from('categorias')
    .select(COLUMNAS_CATEGORIA)
    .order('nombre', { ascending: true });
  if (error) throw error;

  if (!data || data.length === 0) {
    const { data: creadas, error: errorInsert } = await supabase
      .from('categorias')
      .insert(CATEGORIAS_DEFECTO.map((c) => ({ ...c, user_id: userId })))
      .select(COLUMNAS_CATEGORIA);
    if (errorInsert) throw errorInsert;
    return (creadas ?? []).map(mapCategoria).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  return data.map(mapCategoria);
}

// El emoji y la naturaleza se sugieren según el nombre (crear una categoría
// no pide más pasos) y quedan guardados; la naturaleza se cambia después
// desde la edición de la categoría.
export async function crearCategoria(userId: string, nombre: string, tipo: Tipo): Promise<Categoria> {
  const { data, error } = await supabase
    .from('categorias')
    .insert({
      nombre,
      tipo,
      emoji: emojiCategoria(nombre),
      naturaleza: sugerirNaturaleza(nombre, tipo),
      user_id: userId,
    })
    .select(COLUMNAS_CATEGORIA)
    .single();
  if (error) throw error;
  return mapCategoria(data);
}

export async function actualizarCategoria(id: string, cambios: CambiosCategoria): Promise<Categoria> {
  const payload: Record<string, unknown> = {};
  if (cambios.nombre !== undefined) payload.nombre = cambios.nombre;
  if (cambios.emoji !== undefined) payload.emoji = cambios.emoji;
  if (cambios.tipo !== undefined) payload.tipo = cambios.tipo;
  if (cambios.naturaleza !== undefined) payload.naturaleza = cambios.naturaleza;
  if (cambios.esFijo !== undefined) payload.es_fijo = cambios.esFijo;

  const { data, error } = await supabase
    .from('categorias')
    .update(payload)
    .eq('id', id)
    .select(COLUMNAS_CATEGORIA)
    .single();
  if (error) throw error;
  return mapCategoria(data);
}

export async function eliminarCategoria(id: string): Promise<void> {
  const { error } = await supabase.from('categorias').delete().eq('id', id);
  if (error) throw error;
}

export async function obtenerTransacciones(): Promise<Transaccion[]> {
  const { data, error } = await supabase
    .from('transacciones')
    .select(COLUMNAS_TRANSACCION)
    .order('fecha', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapTransaccion);
}

export async function crearTransaccion(
  userId: string,
  nueva: NuevaTransaccion,
  fecha: Date = new Date()
): Promise<Transaccion> {
  const { data, error } = await supabase
    .from('transacciones')
    .insert({
      user_id: userId,
      fecha: fecha.toISOString(),
      item: nueva.item,
      categoria_id: nueva.categoriaId,
      tipo: nueva.tipo,
      monto: nueva.monto,
      semana_del_mes: calcularSemanaDelMes(fecha),
    })
    .select(COLUMNAS_TRANSACCION)
    .single();
  if (error) throw error;
  return mapTransaccion(data);
}

export async function actualizarTransaccion(
  id: string,
  cambios: Partial<NuevaTransaccion>,
  fecha: Date
): Promise<Transaccion> {
  const payload: Record<string, unknown> = {
    fecha: fecha.toISOString(),
    semana_del_mes: calcularSemanaDelMes(fecha),
  };
  if (cambios.item !== undefined) payload.item = cambios.item;
  if (cambios.categoriaId !== undefined) payload.categoria_id = cambios.categoriaId;
  if (cambios.tipo !== undefined) payload.tipo = cambios.tipo;
  if (cambios.monto !== undefined) payload.monto = cambios.monto;

  const { data, error } = await supabase
    .from('transacciones')
    .update(payload)
    .eq('id', id)
    .select(COLUMNAS_TRANSACCION)
    .single();
  if (error) throw error;
  return mapTransaccion(data);
}

export async function eliminarTransaccion(id: string): Promise<void> {
  const { error } = await supabase.from('transacciones').delete().eq('id', id);
  if (error) throw error;
}

// ---- Gastos del año (A4) ----

const COLUMNAS_GASTO_ANUAL = 'id, nombre, monto_estimado, mes_vencimiento, categoria_id, activo';

function mapGastoAnual(row: {
  id: string;
  nombre: string;
  monto_estimado: number;
  mes_vencimiento: number;
  categoria_id: string | null;
  activo: boolean;
}): GastoAnual {
  return {
    id: row.id,
    nombre: row.nombre,
    montoEstimado: Number(row.monto_estimado),
    mesVencimiento: row.mes_vencimiento,
    categoriaId: row.categoria_id,
    activo: row.activo,
  };
}

function filaGastoAnual(gasto: Partial<NuevoGastoAnual>): Record<string, unknown> {
  const fila: Record<string, unknown> = {};
  if (gasto.nombre !== undefined) fila.nombre = gasto.nombre;
  if (gasto.montoEstimado !== undefined) fila.monto_estimado = gasto.montoEstimado;
  if (gasto.mesVencimiento !== undefined) fila.mes_vencimiento = gasto.mesVencimiento;
  if (gasto.categoriaId !== undefined) fila.categoria_id = gasto.categoriaId;
  if (gasto.activo !== undefined) fila.activo = gasto.activo;
  return fila;
}

export async function obtenerGastosAnuales(): Promise<GastoAnual[]> {
  const { data, error } = await supabase
    .from('gastos_anuales')
    .select(COLUMNAS_GASTO_ANUAL)
    .order('mes_vencimiento', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapGastoAnual);
}

export async function crearGastoAnual(nuevo: NuevoGastoAnual): Promise<GastoAnual> {
  const { data, error } = await supabase
    .from('gastos_anuales')
    .insert(filaGastoAnual(nuevo))
    .select(COLUMNAS_GASTO_ANUAL)
    .single();
  if (error) throw error;
  return mapGastoAnual(data);
}

export async function actualizarGastoAnual(id: string, cambios: Partial<NuevoGastoAnual>): Promise<GastoAnual> {
  const { data, error } = await supabase
    .from('gastos_anuales')
    .update(filaGastoAnual(cambios))
    .eq('id', id)
    .select(COLUMNAS_GASTO_ANUAL)
    .single();
  if (error) throw error;
  return mapGastoAnual(data);
}

export async function eliminarGastoAnual(id: string): Promise<void> {
  const { error } = await supabase.from('gastos_anuales').delete().eq('id', id);
  if (error) throw error;
}

// ---- Préstamos ----

const COLUMNAS_PRESTAMO = 'id, persona, monto, fecha_devolucion, nota';

interface FilaPrestamo {
  id: string;
  persona: string;
  monto: number;
  fecha_devolucion: string;
  nota: string | null;
}

function mapPrestamo(row: FilaPrestamo): Prestamo {
  return {
    id: row.id,
    persona: row.persona,
    monto: Number(row.monto),
    fechaDevolucion: row.fecha_devolucion,
    nota: row.nota,
  };
}

export async function obtenerPrestamos(): Promise<Prestamo[]> {
  const { data, error } = await supabase
    .from('prestamos')
    .select(COLUMNAS_PRESTAMO)
    .order('fecha_devolucion', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapPrestamo);
}

// El préstamo y su salida se crean juntos en la base (función crear_prestamo):
// si la conexión se cae a la mitad no queda uno sin el otro.
export async function crearPrestamo(
  nuevo: NuevoPrestamo,
  fecha: Date = new Date()
): Promise<{ prestamo: Prestamo; salida: Transaccion }> {
  const { data, error } = await supabase.rpc('crear_prestamo', {
    p_persona: nuevo.persona,
    p_monto: nuevo.monto,
    p_fecha_devolucion: nuevo.fechaDevolucion,
    p_nota: nuevo.nota,
    p_fecha: fecha.toISOString(),
  });
  if (error) throw error;
  const resultado = data as { prestamo: FilaPrestamo; transaccion: FilaTransaccion };
  return { prestamo: mapPrestamo(resultado.prestamo), salida: mapTransaccion(resultado.transaccion) };
}

// El monto no se edita: cambiarlo descuadraría la salida ya registrada. Para
// corregirlo, se elimina el préstamo y se crea de nuevo.
export async function actualizarPrestamo(
  id: string,
  cambios: Pick<NuevoPrestamo, 'persona' | 'fechaDevolucion' | 'nota'>
): Promise<Prestamo> {
  const { data, error } = await supabase
    .from('prestamos')
    .update({ persona: cambios.persona, fecha_devolucion: cambios.fechaDevolucion, nota: cambios.nota })
    .eq('id', id)
    .select(COLUMNAS_PRESTAMO)
    .single();
  if (error) throw error;
  // La descripción de la salida lleva el nombre: se mantiene al día. Si esto
  // falla, solo queda un texto viejo en el historial; el dinero no cambia.
  await supabase
    .from('transacciones')
    .update({ item: `Préstamo a ${cambios.persona}` })
    .eq('prestamo_id', id)
    .eq('tipo', 'egreso');
  return mapPrestamo(data);
}

// Borra también la salida y los abonos (on delete cascade en la base).
export async function eliminarPrestamo(id: string): Promise<void> {
  const { error } = await supabase.from('prestamos').delete().eq('id', id);
  if (error) throw error;
}

export async function registrarAbono(prestamo: Prestamo, monto: number, fecha: Date = new Date()): Promise<Transaccion> {
  const { data, error } = await supabase
    .from('transacciones')
    .insert({
      fecha: fecha.toISOString(),
      item: `Abono de ${prestamo.persona}`,
      categoria_id: null,
      tipo: 'ingreso',
      monto,
      semana_del_mes: calcularSemanaDelMes(fecha),
      prestamo_id: prestamo.id,
    })
    .select(COLUMNAS_TRANSACCION)
    .single();
  if (error) throw error;
  return mapTransaccion(data);
}

// ---- Notificaciones push ----

export async function guardarSuscripcionPush(endpoint: string, p256dh: string, auth: string): Promise<void> {
  const { error } = await supabase.rpc('guardar_suscripcion_push', {
    p_endpoint: endpoint,
    p_p256dh: p256dh,
    p_auth: auth,
  });
  if (error) throw error;
}

export async function eliminarSuscripcionPush(endpoint: string): Promise<void> {
  const { error } = await supabase.from('suscripciones_push').delete().eq('endpoint', endpoint);
  if (error) throw error;
}
