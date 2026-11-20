import type { Credito, Transaccion } from '../types';
import { fechaDesdeISO, fechaLocalISO } from './fechas';
import { formatearDia, type TonoVencimiento } from './prestamos';

const MS_POR_DIA = 86_400_000;
// Un crédito de consumo normal no llega ni cerca; sirve de tope a la búsqueda.
const TASA_MENSUAL_MAXIMA = 1;

type Contrato = Pick<Credito, 'montoFinanciado' | 'cuota' | 'plazoMeses'>;

// Tasa mensual que hace que las cuotas, traídas a hoy, valgan exactamente lo
// que el banco prestó:  prestado = cuota × (1 − (1 + i)^−n) / i.
// No tiene despeje directo, así que se busca por bisección (el lado derecho
// baja siempre al subir i). Si las cuotas suman menos que lo prestado no hay
// forma de que existan intereses: 0.
//
// Ojo: lo que sale es la tasa *implícita* de las cuotas, o sea intereses más
// cualquier seguro o cobro fijo que el banco meta dentro de la cuota. Es el
// costo real de lo que el usuario paga cada mes.
export function tasaMensualDeCredito({ montoFinanciado, cuota, plazoMeses }: Contrato): number {
  if (cuota * plazoMeses <= montoFinanciado) return 0;
  const faltante = (i: number) => (cuota * (1 - (1 + i) ** -plazoMeses)) / i - montoFinanciado;
  let bajo = 1e-12;
  let alto = TASA_MENSUAL_MAXIMA;
  for (let vuelta = 0; vuelta < 200; vuelta++) {
    const medio = (bajo + alto) / 2;
    if (faltante(medio) > 0) bajo = medio;
    else alto = medio;
  }
  return (bajo + alto) / 2;
}

// Tasa efectiva anual en %, la que usan los bancos para comparar créditos.
export function tasaEfectivaAnual(tasaMensual: number): number {
  return ((1 + tasaMensual) ** 12 - 1) * 100;
}

// Día en que vence la cuota `numero` (1 = la primera): el mismo día del mes de
// la primera cuota, un mes más tarde cada vez. Si el mes es más corto se toma
// su último día (una cuota del 31 vence el 30 de abril y el 28 de febrero),
// sin arrastrar ese ajuste a los meses siguientes.
export function fechaDeCuota(fechaPrimeraCuota: string, numero: number): string {
  const [anio, mes, dia] = fechaPrimeraCuota.split('-').map(Number);
  const destino = new Date(anio, mes - 1 + (numero - 1), 1);
  const ultimoDia = new Date(destino.getFullYear(), destino.getMonth() + 1, 0).getDate();
  destino.setDate(Math.min(dia, ultimoDia));
  return fechaLocalISO(destino);
}

// El usuario dice cuándo vence su próxima cuota y cuántas lleva pagadas; de
// ahí sale cuándo venció la primera (se guarda esa, que no cambia con el tiempo).
export function fechaPrimeraCuotaDesdeProxima(fechaProxima: string, cuotasPagadas: number): string {
  const [anio, mes, dia] = fechaProxima.split('-').map(Number);
  const destino = new Date(anio, mes - 1 - cuotasPagadas, 1);
  const ultimoDia = new Date(destino.getFullYear(), destino.getMonth() + 1, 0).getDate();
  destino.setDate(Math.min(dia, ultimoDia));
  return fechaLocalISO(destino);
}

export interface CuotaCredito {
  numero: number;
  fecha: string;
  cuota: number;
  // Lo que de esta cuota se va en intereses y lo que baja la deuda.
  interes: number;
  capital: number;
  // Lo que se debe de capital después de pagar esta cuota.
  saldo: number;
}

// Tabla de amortización de cuota fija (sistema francés): cada mes los
// intereses son la tasa por lo que aún se debe, y el resto de la cuota baja la
// deuda. Al principio casi toda la cuota son intereses, y con los meses el
// capital va ganando peso. La última cuota cierra la deuda justo en cero.
export function tablaAmortizacion(credito: Contrato & Pick<Credito, 'fechaPrimeraCuota'>): CuotaCredito[] {
  const tasa = tasaMensualDeCredito(credito);
  const filas: CuotaCredito[] = [];
  let saldo = credito.montoFinanciado;
  for (let numero = 1; numero <= credito.plazoMeses; numero++) {
    const ultima = numero === credito.plazoMeses;
    const capital = ultima ? saldo : Math.min(saldo, credito.cuota - saldo * tasa);
    const interes = credito.cuota - capital;
    saldo = ultima ? 0 : saldo - capital;
    filas.push({ numero, fecha: fechaDeCuota(credito.fechaPrimeraCuota, numero), cuota: credito.cuota, interes, capital, saldo });
  }
  return filas;
}

export interface EstadoCredito extends Credito {
  // Pagos registrados en la app, del más reciente al más viejo.
  pagos: Transaccion[];
  tabla: CuotaCredito[];
  cuotasPagadas: number;
  cuotasRestantes: number;
  // 0–1: cuotas pagadas sobre el plazo.
  progreso: number;
  // Lo pagado: las cuotas que ya estaban pagadas (a su valor) más los pagos registrados.
  totalPagado: number;
  // Lo que falta: cuota por cuotas restantes.
  porPagar: number;
  totalAPagar: number;
  interesesTotal: number;
  interesesPagados: number;
  interesesPorPagar: number;
  capitalPagado: number;
  // Lo que todavía se debe de capital (sin intereses futuros).
  saldoCapital: number;
  tasaMensual: number;
  tasaEfectivaAnual: number;
  saldado: boolean;
  // Cuota que toca pagar y el día en que vence; null si ya está saldado.
  proximaCuota: CuotaCredito | null;
  vencida: boolean;
  diasVencida: number;
  // Días que faltan para la próxima cuota (negativo si ya pasó).
  diasParaProxima: number | null;
  fechaFinal: string;
}

export function estadosCreditos(creditos: Credito[], transacciones: Transaccion[], hoy: Date = new Date()): EstadoCredito[] {
  const pagosPorCredito = new Map<string, Transaccion[]>();
  for (const t of transacciones) {
    if (!t.creditoId) continue;
    const lista = pagosPorCredito.get(t.creditoId);
    if (lista) lista.push(t);
    else pagosPorCredito.set(t.creditoId, [t]);
  }
  const hoyLocal = fechaLocalISO(hoy);
  const inicioDeHoy = fechaDesdeISO(hoyLocal).getTime();

  return creditos.map((c) => {
    const pagos = (pagosPorCredito.get(c.id) ?? []).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    const tabla = tablaAmortizacion(c);
    const cuotasPagadas = Math.min(c.plazoMeses, c.cuotasPagadasInicial + pagos.length);
    const cuotasRestantes = c.plazoMeses - cuotasPagadas;
    const pagadas = tabla.slice(0, cuotasPagadas);
    const sumar = (filas: CuotaCredito[], campo: 'interes' | 'capital') => filas.reduce((acc, fila) => acc + fila[campo], 0);
    const saldado = cuotasRestantes === 0;
    const proximaCuota = saldado ? null : tabla[cuotasPagadas];
    const diasParaProxima = proximaCuota
      ? Math.round((fechaDesdeISO(proximaCuota.fecha).getTime() - inicioDeHoy) / MS_POR_DIA)
      : null;
    const vencida = diasParaProxima !== null && diasParaProxima < 0;
    const tasaMensual = tasaMensualDeCredito(c);
    return {
      ...c,
      pagos,
      tabla,
      cuotasPagadas,
      cuotasRestantes,
      progreso: c.plazoMeses > 0 ? cuotasPagadas / c.plazoMeses : 0,
      totalPagado: c.cuotasPagadasInicial * c.cuota + pagos.reduce((acc, p) => acc + p.monto, 0),
      porPagar: c.cuota * cuotasRestantes,
      totalAPagar: c.cuota * c.plazoMeses,
      interesesTotal: c.cuota * c.plazoMeses - c.montoFinanciado,
      interesesPagados: sumar(pagadas, 'interes'),
      interesesPorPagar: sumar(tabla.slice(cuotasPagadas), 'interes'),
      capitalPagado: sumar(pagadas, 'capital'),
      saldoCapital: saldado ? 0 : tabla[cuotasPagadas - 1]?.saldo ?? c.montoFinanciado,
      tasaMensual,
      tasaEfectivaAnual: tasaEfectivaAnual(tasaMensual),
      saldado,
      proximaCuota,
      vencida,
      diasVencida: vencida && diasParaProxima !== null ? -diasParaProxima : 0,
      diasParaProxima,
      fechaFinal: tabla[tabla.length - 1]?.fecha ?? c.fechaPrimeraCuota,
    };
  });
}

export interface ResumenCreditos {
  // Lo que falta por pagar entre todos los créditos (cuotas que quedan).
  porPagar: number;
  activos: number;
  vencidos: number;
  interesesPagados: number;
  interesesPorPagar: number;
  // Lo que ya bajó la deuda de todos los créditos (capital de las cuotas pagadas).
  capitalPagado: number;
  // Cuotas que vencen este mes (o ya vencidas sin pagar), sumadas.
  cuotasDelMes: number;
}

export function resumirCreditos(estados: EstadoCredito[], hoy: Date = new Date()): ResumenCreditos {
  const claveMes = fechaLocalISO(hoy).slice(0, 7);
  const resumen: ResumenCreditos = {
    porPagar: 0,
    activos: 0,
    vencidos: 0,
    interesesPagados: 0,
    interesesPorPagar: 0,
    capitalPagado: 0,
    cuotasDelMes: 0,
  };
  for (const e of estados) {
    resumen.interesesPagados += e.interesesPagados;
    resumen.capitalPagado += e.capitalPagado;
    if (e.saldado) continue;
    resumen.porPagar += e.porPagar;
    resumen.activos += 1;
    resumen.interesesPorPagar += e.interesesPorPagar;
    if (e.vencida) resumen.vencidos += 1;
    if (e.proximaCuota && (e.vencida || e.proximaCuota.fecha.startsWith(claveMes))) resumen.cuotasDelMes += e.cuota;
  }
  return resumen;
}

// Lo que cuesta pedir prestado, dicho en pesos de a mil: "por cada $1.000 que
// te prestaron pagas $1.400". Más fácil de sentir que una tasa.
export function costoPorMil(estado: Pick<EstadoCredito, 'totalAPagar' | 'montoFinanciado'>): number {
  return estado.montoFinanciado > 0 ? Math.round((estado.totalAPagar / estado.montoFinanciado) * 1000) : 1000;
}

// Cuándo vence la próxima cuota, dicho como lo diría una persona. Mismo
// lenguaje de colores y tonos que los préstamos (utils/prestamos.ts).
export function describirProximaCuota(estado: EstadoCredito): { texto: string; tono: TonoVencimiento } {
  if (estado.saldado || !estado.proximaCuota || estado.diasParaProxima === null) return { texto: 'Crédito pagado', tono: 'pagado' };
  if (estado.vencida) {
    return { texto: estado.diasVencida === 1 ? 'Venció ayer' : `Venció hace ${estado.diasVencida} días`, tono: 'vencido' };
  }
  const dias = estado.diasParaProxima;
  if (dias === 0) return { texto: 'Vence hoy', tono: 'pronto' };
  if (dias === 1) return { texto: 'Vence mañana', tono: 'pronto' };
  if (dias <= 7) return { texto: `Vence en ${dias} días`, tono: 'pronto' };
  return { texto: `Vence el ${formatearDia(estado.proximaCuota.fecha)}`, tono: 'tranquilo' };
}

export const NOMBRES_SUGERIDOS_CREDITO = ['Moto', 'Carro', 'Vivienda', 'Libre inversión', 'Estudio'];

// Un emoji que se parezca a lo que se financió; sin pista, el banco.
export function emojiCredito(nombre: string): string {
  const n = nombre.toLowerCase();
  if (/moto/.test(n)) return '🏍️';
  if (/carro|auto|veh[ií]culo|camioneta|coche/.test(n)) return '🚗';
  if (/casa|vivienda|hipoteca|apartamento|apto|inmueble/.test(n)) return '🏠';
  if (/estudio|educaci|universidad|icetex|matr[ií]cula/.test(n)) return '🎓';
  if (/celular|tel[eé]fono|computador|port[aá]til/.test(n)) return '📱';
  return '🏦';
}

// '2028-11-05' → "5 nov 2028". Lleva el año porque un crédito dura años.
export function formatearDiaConAnio(iso: string): string {
  return fechaDesdeISO(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
}
