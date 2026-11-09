import { useMemo } from 'react';
import { useAuth } from '../auth/AuthContext';
import { actividadPorMes, calcularAntiguedad, rachaDeMeses, type Antiguedad, type MesActividad, type Racha } from '../utils/antiguedad';
import { claveMes } from '../utils/fechas';
import { useFinanzas } from './FinanzasContext';

export type MetodoInicio = 'google' | 'correo';

const MESES_DE_CONSTANCIA = 6;

export interface Perfil {
  nombre: string;
  correo: string;
  fotoUrl: string | null;
  metodo: MetodoInicio;
  miembroDesde: Date;
  antiguedad: Antiguedad;
  constancia: MesActividad[];
  racha: Racha;
  movimientos: number;
  categorias: number;
  mesesRegistrados: number;
}

function texto(valor: unknown): string | null {
  return typeof valor === 'string' && valor.trim() ? valor.trim() : null;
}

// Sin nombre (cuenta de correo): la parte antes de la @, con los puntos y
// guiones como espacios y cada palabra con mayúscula (ana.perez → Ana Perez).
function nombreDesdeCorreo(correo: string): string {
  const usuario = correo.split('@')[0] ?? '';
  const palabras = usuario.split(/[._-]+/).filter(Boolean);
  return palabras.length ? palabras.map((p) => p[0].toUpperCase() + p.slice(1)).join(' ') : 'Tu cuenta';
}

// Datos del perfil a partir de la sesión de Supabase (Google llena nombre y
// foto en user_metadata; con correo y contraseña solo hay correo) y de la
// actividad registrada en la app.
export function usePerfil(): Perfil | null {
  const { session } = useAuth();
  const { transacciones, categorias } = useFinanzas();
  const usuario = session?.user;
  const creadaEn = usuario?.created_at;

  const datosDeUso = useMemo(() => {
    const hoy = new Date();
    // Desde la creación de la cuenta o el movimiento más antiguo, lo que sea
    // primero: si se registraron meses anteriores, la historia empieza ahí.
    const primerMovimiento = transacciones.reduce<number>((min, t) => Math.min(min, new Date(t.fecha).getTime()), Infinity);
    const inicio = new Date(Math.min(creadaEn ? new Date(creadaEn).getTime() : hoy.getTime(), primerMovimiento));
    return {
      inicio,
      antiguedad: calcularAntiguedad(inicio, hoy),
      constancia: actividadPorMes(transacciones, inicio, hoy, MESES_DE_CONSTANCIA),
      racha: rachaDeMeses(transacciones, hoy),
      mesesRegistrados: new Set(transacciones.map((t) => claveMes(t.fecha))).size,
    };
  }, [transacciones, creadaEn]);

  if (!usuario) return null;

  const datos = usuario.user_metadata ?? {};
  const correo = usuario.email ?? '';
  return {
    nombre: texto(datos.full_name) ?? texto(datos.name) ?? nombreDesdeCorreo(correo),
    correo,
    fotoUrl: texto(datos.avatar_url) ?? texto(datos.picture),
    metodo: usuario.app_metadata?.provider === 'google' ? 'google' : 'correo',
    miembroDesde: datosDeUso.inicio,
    antiguedad: datosDeUso.antiguedad,
    constancia: datosDeUso.constancia,
    racha: datosDeUso.racha,
    movimientos: transacciones.length,
    categorias: categorias.length,
    mesesRegistrados: datosDeUso.mesesRegistrados,
  };
}
