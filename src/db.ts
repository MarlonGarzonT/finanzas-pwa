import { supabase } from './supabaseClient';
import type { Categoria, NuevaTransaccion, Transaccion } from './types';
import { calcularSemanaDelMes } from './utils/fechas';
import { emojiCategoria } from './utils/emojiCategoria';

const CATEGORIAS_DEFECTO = [
  { nombre: 'Comida', emoji: '🍔' },
  { nombre: 'Transporte', emoji: '🚗' },
  { nombre: 'Vivienda', emoji: '🏠' },
  { nombre: 'Salud', emoji: '💊' },
  { nombre: 'Entretenimiento', emoji: '🎮' },
  { nombre: 'Servicios', emoji: '💡' },
  { nombre: 'Salario', emoji: '💰' },
  { nombre: 'Otros', emoji: '🏷️' },
];

function mapTransaccion(row: {
  id: string;
  fecha: string;
  item: string;
  categoria_id: string;
  tipo: 'ingreso' | 'egreso';
  monto: number;
  semana_del_mes: number;
}): Transaccion {
  return {
    id: row.id,
    fecha: row.fecha,
    item: row.item,
    categoriaId: row.categoria_id,
    tipo: row.tipo,
    monto: Number(row.monto),
    semanaDelMes: row.semana_del_mes,
  };
}

export async function obtenerCategorias(userId: string): Promise<Categoria[]> {
  const { data, error } = await supabase
    .from('categorias')
    .select('id, nombre, emoji')
    .order('nombre', { ascending: true });
  if (error) throw error;

  if (!data || data.length === 0) {
    const { data: creadas, error: errorInsert } = await supabase
      .from('categorias')
      .insert(CATEGORIAS_DEFECTO.map(({ nombre, emoji }) => ({ nombre, emoji, user_id: userId })))
      .select('id, nombre, emoji');
    if (errorInsert) throw errorInsert;
    return (creadas ?? []).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  return data;
}

// El emoji es predeterminado según el nombre (el usuario no lo elige) y
// queda guardado en la categoría, no se recalcula en cada render.
export async function crearCategoria(userId: string, nombre: string): Promise<Categoria> {
  const { data, error } = await supabase
    .from('categorias')
    .insert({ nombre, emoji: emojiCategoria(nombre), user_id: userId })
    .select('id, nombre, emoji')
    .single();
  if (error) throw error;
  return data;
}

export async function eliminarCategoria(id: string): Promise<void> {
  const { error } = await supabase.from('categorias').delete().eq('id', id);
  if (error) throw error;
}

export async function obtenerTransacciones(): Promise<Transaccion[]> {
  const { data, error } = await supabase
    .from('transacciones')
    .select('id, fecha, item, categoria_id, tipo, monto, semana_del_mes')
    .order('fecha', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapTransaccion);
}

export async function crearTransaccion(userId: string, nueva: NuevaTransaccion): Promise<Transaccion> {
  const ahora = new Date();
  const { data, error } = await supabase
    .from('transacciones')
    .insert({
      user_id: userId,
      fecha: ahora.toISOString(),
      item: nueva.item,
      categoria_id: nueva.categoriaId,
      tipo: nueva.tipo,
      monto: nueva.monto,
      semana_del_mes: calcularSemanaDelMes(ahora),
    })
    .select('id, fecha, item, categoria_id, tipo, monto, semana_del_mes')
    .single();
  if (error) throw error;
  return mapTransaccion(data);
}

export async function actualizarTransaccion(
  id: string,
  cambios: Partial<NuevaTransaccion>
): Promise<Transaccion> {
  const payload: Record<string, unknown> = {};
  if (cambios.item !== undefined) payload.item = cambios.item;
  if (cambios.categoriaId !== undefined) payload.categoria_id = cambios.categoriaId;
  if (cambios.tipo !== undefined) payload.tipo = cambios.tipo;
  if (cambios.monto !== undefined) payload.monto = cambios.monto;

  const { data, error } = await supabase
    .from('transacciones')
    .update(payload)
    .eq('id', id)
    .select('id, fecha, item, categoria_id, tipo, monto, semana_del_mes')
    .single();
  if (error) throw error;
  return mapTransaccion(data);
}

export async function eliminarTransaccion(id: string): Promise<void> {
  const { error } = await supabase.from('transacciones').delete().eq('id', id);
  if (error) throw error;
}
