import { supabase } from './supabaseClient';
import type {
  DetalleGrupo,
  GastoGrupo,
  Grupo,
  MiembroGrupo,
  NuevoGastoGrupo,
  PagoGrupo,
  ParteGasto,
} from './types';

function mapGrupo(row: { id: string; nombre: string; codigo: string; creado_por: string }): Grupo {
  return { id: row.id, nombre: row.nombre, codigo: row.codigo, creadoPor: row.creado_por };
}

function mapMiembro(row: { grupo_id: string; user_id: string; nombre_visible: string }): MiembroGrupo {
  return { grupoId: row.grupo_id, userId: row.user_id, nombreVisible: row.nombre_visible };
}

function mapGasto(row: {
  id: string;
  grupo_id: string;
  pagado_por: string;
  descripcion: string;
  monto: number;
  fecha: string;
  creado_por: string;
}): GastoGrupo {
  return {
    id: row.id,
    grupoId: row.grupo_id,
    pagadoPor: row.pagado_por,
    descripcion: row.descripcion,
    monto: Number(row.monto),
    fecha: row.fecha,
    creadoPor: row.creado_por,
  };
}

function mapParte(row: { gasto_id: string; user_id: string; monto: number }): ParteGasto {
  return { gastoId: row.gasto_id, userId: row.user_id, monto: Number(row.monto) };
}

function mapPago(row: {
  id: string;
  grupo_id: string;
  de_user_id: string;
  a_user_id: string;
  monto: number;
  fecha: string;
}): PagoGrupo {
  return {
    id: row.id,
    grupoId: row.grupo_id,
    deUserId: row.de_user_id,
    aUserId: row.a_user_id,
    monto: Number(row.monto),
    fecha: row.fecha,
  };
}

const COLUMNAS_GRUPO = 'id, nombre, codigo, creado_por';
const COLUMNAS_MIEMBRO = 'grupo_id, user_id, nombre_visible';
const COLUMNAS_GASTO = 'id, grupo_id, pagado_por, descripcion, monto, fecha, creado_por';
const COLUMNAS_PARTE = 'gasto_id, user_id, monto';
const COLUMNAS_PAGO = 'id, grupo_id, de_user_id, a_user_id, monto, fecha';

export async function obtenerGrupos(userId: string): Promise<Grupo[]> {
  const { data: membresias, error: errorMembresias } = await supabase
    .from('grupo_miembros')
    .select('grupo_id')
    .eq('user_id', userId);
  if (errorMembresias) throw errorMembresias;

  const idsGrupos = (membresias ?? []).map((m) => m.grupo_id);
  if (idsGrupos.length === 0) return [];

  const { data, error } = await supabase.from('grupos').select(COLUMNAS_GRUPO).in('id', idsGrupos);
  if (error) throw error;
  return (data ?? []).map(mapGrupo);
}

export async function crearGrupo(nombre: string, nombreVisible: string): Promise<Grupo> {
  const { data: grupoId, error: errorRpc } = await supabase.rpc('crear_grupo', {
    p_nombre: nombre,
    p_nombre_visible: nombreVisible,
  });
  if (errorRpc) throw errorRpc;

  const { data, error } = await supabase.from('grupos').select(COLUMNAS_GRUPO).eq('id', grupoId).single();
  if (error) throw error;
  return mapGrupo(data);
}

export async function unirseAGrupo(codigo: string, nombreVisible: string): Promise<Grupo> {
  const { data: grupoId, error: errorRpc } = await supabase.rpc('unirse_a_grupo', {
    p_codigo: codigo,
    p_nombre_visible: nombreVisible,
  });
  if (errorRpc) throw errorRpc;

  const { data, error } = await supabase.from('grupos').select(COLUMNAS_GRUPO).eq('id', grupoId).single();
  if (error) throw error;
  return mapGrupo(data);
}

export async function obtenerDetalleGrupo(grupoId: string): Promise<DetalleGrupo> {
  const [{ data: miembros, error: errorMiembros }, { data: gastos, error: errorGastos }, { data: pagos, error: errorPagos }] =
    await Promise.all([
      supabase.from('grupo_miembros').select(COLUMNAS_MIEMBRO).eq('grupo_id', grupoId),
      supabase.from('grupo_gastos').select(COLUMNAS_GASTO).eq('grupo_id', grupoId).order('fecha', { ascending: false }),
      supabase.from('grupo_pagos').select(COLUMNAS_PAGO).eq('grupo_id', grupoId).order('fecha', { ascending: false }),
    ]);
  if (errorMiembros) throw errorMiembros;
  if (errorGastos) throw errorGastos;
  if (errorPagos) throw errorPagos;

  const idsGastos = (gastos ?? []).map((g) => g.id);
  let partes: ParteGasto[] = [];
  if (idsGastos.length > 0) {
    const { data, error } = await supabase.from('grupo_gasto_partes').select(COLUMNAS_PARTE).in('gasto_id', idsGastos);
    if (error) throw error;
    partes = (data ?? []).map(mapParte);
  }

  return {
    miembros: (miembros ?? []).map(mapMiembro),
    gastos: (gastos ?? []).map(mapGasto),
    partes,
    pagos: (pagos ?? []).map(mapPago),
  };
}

export async function crearGastoGrupo(nuevo: NuevoGastoGrupo): Promise<string> {
  const { data: gastoId, error } = await supabase.rpc('crear_gasto_grupo', {
    p_grupo_id: nuevo.grupoId,
    p_descripcion: nuevo.descripcion,
    p_monto: nuevo.monto,
    p_pagado_por: nuevo.pagadoPor,
    p_partes: nuevo.partes.map((p) => ({ user_id: p.userId, monto: p.monto })),
  });
  if (error) throw error;
  return gastoId as string;
}

export async function eliminarGastoGrupo(id: string): Promise<void> {
  const { error } = await supabase.from('grupo_gastos').delete().eq('id', id);
  if (error) throw error;
}

export async function registrarPago(
  grupoId: string,
  deUserId: string,
  aUserId: string,
  monto: number
): Promise<PagoGrupo> {
  const { data, error } = await supabase
    .from('grupo_pagos')
    .insert({ grupo_id: grupoId, de_user_id: deUserId, a_user_id: aUserId, monto })
    .select(COLUMNAS_PAGO)
    .single();
  if (error) throw error;
  return mapPago(data);
}
