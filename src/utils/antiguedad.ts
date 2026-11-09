import type { Transaccion } from '../types';
import { claveMes, claveMesDeFecha } from './fechas';

export interface Hito {
  dias: number;
  etiqueta: string;
}

// Hitos de permanencia, como las medallas de constancia de las apps de
// hábitos: el primero llega rápido para que el logro se sienta pronto.
const HITOS: Hito[] = [
  { dias: 7, etiqueta: '1 semana' },
  { dias: 30, etiqueta: '1 mes' },
  { dias: 90, etiqueta: '3 meses' },
  { dias: 180, etiqueta: '6 meses' },
  { dias: 365, etiqueta: '1 año' },
  { dias: 730, etiqueta: '2 años' },
  { dias: 1095, etiqueta: '3 años' },
  { dias: 1825, etiqueta: '5 años' },
];

const MS_DIA = 24 * 60 * 60 * 1000;

export interface Antiguedad {
  dias: number;
  // Frase completa para lectores de pantalla ("2 meses y 28 días").
  texto: string;
  // La misma frase partida para destacarla: cifra grande + unidad + resto.
  // Sin cifra el primer día (se muestra "Hoy").
  cifra: number | null;
  unidad: string;
  resto: string | null;
  hitoAlcanzado: Hito | null;
  siguienteHito: Hito | null;
  // Avance entre el hito alcanzado (o el día 0) y el siguiente, de 0 a 1.
  progreso: number;
  diasParaSiguiente: number;
}

function unidad(n: number, singular: string, varios: string): string {
  return n === 1 ? singular : varios;
}

function plural(n: number, singular: string, varios: string): string {
  return `${n} ${unidad(n, singular, varios)}`;
}

function sumarMesesExactos(fecha: Date, meses: number): Date {
  const resultado = new Date(fecha);
  resultado.setMonth(resultado.getMonth() + meses);
  return resultado;
}

// Tiempo en la app en meses de calendario (no bloques de 30 días): del 12 de
// agosto al 9 de noviembre son "2 meses y 28 días".
export function calcularAntiguedad(desde: Date, hoy: Date = new Date()): Antiguedad {
  const dias = Math.max(0, Math.floor((hoy.getTime() - desde.getTime()) / MS_DIA));

  let meses = (hoy.getFullYear() - desde.getFullYear()) * 12 + (hoy.getMonth() - desde.getMonth());
  if (sumarMesesExactos(desde, meses) > hoy) meses -= 1;
  meses = Math.max(0, meses);
  const diasSueltos = Math.max(0, Math.floor((hoy.getTime() - sumarMesesExactos(desde, meses).getTime()) / MS_DIA));
  const anios = Math.floor(meses / 12);
  const mesesSueltos = meses % 12;

  let cifra: number | null;
  let nombreUnidad: string;
  let resto: string | null = null;
  if (dias === 0) {
    cifra = null;
    nombreUnidad = 'Hoy';
  } else if (anios > 0) {
    cifra = anios;
    nombreUnidad = unidad(anios, 'año', 'años');
    if (mesesSueltos) resto = `y ${plural(mesesSueltos, 'mes', 'meses')}`;
  } else if (meses > 0) {
    cifra = meses;
    nombreUnidad = unidad(meses, 'mes', 'meses');
    if (diasSueltos) resto = `y ${plural(diasSueltos, 'día', 'días')}`;
  } else {
    cifra = dias;
    nombreUnidad = unidad(dias, 'día', 'días');
  }
  const texto = cifra === null ? 'Empezaste hoy' : [cifra, nombreUnidad, resto].filter(Boolean).join(' ');

  const indiceSiguiente = HITOS.findIndex((h) => h.dias > dias);
  const siguienteHito = indiceSiguiente === -1 ? null : HITOS[indiceSiguiente];
  const hitoAlcanzado = indiceSiguiente === -1 ? HITOS[HITOS.length - 1] : HITOS[indiceSiguiente - 1] ?? null;
  const base = hitoAlcanzado?.dias ?? 0;
  const progreso = siguienteHito ? (dias - base) / (siguienteHito.dias - base) : 1;

  return {
    dias,
    texto,
    cifra,
    unidad: nombreUnidad,
    resto,
    hitoAlcanzado,
    siguienteHito,
    progreso,
    diasParaSiguiente: siguienteHito ? siguienteHito.dias - dias : 0,
  };
}

export interface MesActividad {
  mes: Date;
  movimientos: number;
}

// Movimientos por mes desde que empezó (como mucho los últimos `maximo`), en
// hora local: la "constancia" que se ve en el perfil.
export function actividadPorMes(transacciones: Transaccion[], desde: Date, hoy: Date, maximo: number): MesActividad[] {
  const totalMeses = (hoy.getFullYear() - desde.getFullYear()) * 12 + (hoy.getMonth() - desde.getMonth()) + 1;
  const cantidad = Math.max(1, Math.min(maximo, totalMeses));
  const meses = Array.from({ length: cantidad }, (_, i) => new Date(hoy.getFullYear(), hoy.getMonth() - (cantidad - 1 - i), 1));
  const conteo = new Map<string, number>();
  for (const t of transacciones) {
    const clave = claveMes(t.fecha);
    conteo.set(clave, (conteo.get(clave) ?? 0) + 1);
  }
  return meses.map((mes) => ({ mes, movimientos: conteo.get(claveMesDeFecha(mes)) ?? 0 }));
}

// Meses seguidos con al menos un movimiento, contando hacia atrás desde el mes
// actual. Si este mes aún no tiene nada, la racha sigue viva desde el anterior
// (el mes no ha terminado).
export interface Racha {
  meses: number;
  // Primer mes de la racha (null si no hay racha).
  desde: Date | null;
}

export function rachaDeMeses(transacciones: Transaccion[], hoy: Date): Racha {
  const conMovimientos = new Set(transacciones.map((t) => claveMes(t.fecha)));
  let cursor = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  if (!conMovimientos.has(claveMesDeFecha(cursor))) cursor = new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1);
  let meses = 0;
  let desde: Date | null = null;
  while (conMovimientos.has(claveMesDeFecha(cursor))) {
    meses += 1;
    desde = cursor;
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1);
  }
  return { meses, desde };
}
