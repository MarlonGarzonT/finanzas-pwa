import { supabase } from './supabaseClient';
import type { CambiosCategoria, Categoria, NuevaTransaccion, Tipo, Transaccion } from './types';
import { calcularSemanaDelMes } from './utils/fechas';
import { emojiCategoria } from './utils/emojiCategoria';

const CATEGORIAS_DEFECTO: { nombre: string; emoji: string; tipo: Tipo }[] = [
  { nombre: 'Comida', emoji: '🍔', tipo: 'egreso' },
  { nombre: 'Transporte', emoji: '🚗', tipo: 'egreso' },
  { nombre: 'Vivienda', emoji: '🏠', tipo: 'egreso' },
  { nombre: 'Salud', emoji: '💊', tipo: 'egreso' },
  { nombre: 'Entretenimiento', emoji: '🎮', tipo: 'egreso' },
  { nombre: 'Servicios', emoji: '💡', tipo: 'egreso' },
  { nombre: 'Salario', emoji: '💰', tipo: 'ingreso' },
  { nombre: 'Otros', emoji: '🏷️', tipo: 'egreso' },
];

function mapCategoria(row: { id: string; nombre: string; emoji: string; tipo: Tipo; es_fijo: boolean }): Categoria {
  return {
    id: row.id,
    nombre: row.nombre,
    emoji: row.emoji,
    tipo: row.tipo,
    esFijo: row.es_fijo,
  };
}

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

const COLUMNAS_CATEGORIA = 'id, nombre, emoji, tipo, es_fijo';

export async function obtenerCategorias(userId: string): Promise<Categoria[]> {
  const { data, error } = await supabase
    .from('categorias')
    .select(COLUMNAS_CATEGORIA)
    .order('nombre', { ascending: true });
  if (error) throw error;

  if (!data || data.length === 0) {
    const { data: creadas, error: errorInsert } = await supabase
      .from('categorias')
      .insert(CATEGORIAS_DEFECTO.map(({ nombre, emoji, tipo }) => ({ nombre, emoji, tipo, user_id: userId })))
      .select(COLUMNAS_CATEGORIA);
    if (errorInsert) throw errorInsert;
    return (creadas ?? []).map(mapCategoria).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  return data.map(mapCategoria);
}

// El emoji es predeterminado según el nombre (el usuario no lo elige) y
// queda guardado en la categoría, no se recalcula en cada render.
export async function crearCategoria(userId: string, nombre: string, tipo: Tipo): Promise<Categoria> {
  const { data, error } = await supabase
    .from('categorias')
    .insert({ nombre, tipo, emoji: emojiCategoria(nombre), user_id: userId })
    .select(COLUMNAS_CATEGORIA)
    .single();
  if (error) throw error;
  return mapCategoria(data);
}

export async function actualizarCategoria(id: string, cambios: CambiosCategoria): Promise<Categoria> {
  const payload: Record<string, unknown> = {};
  if (cambios.emoji !== undefined) payload.emoji = cambios.emoji;
  if (cambios.tipo !== undefined) payload.tipo = cambios.tipo;
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
