import type { GastoGrupo, PagoGrupo, ParteGasto } from '../types';

// Saldo neto por persona: positivo = le deben (a favor), negativo = debe.
export function calcularBalances(gastos: GastoGrupo[], partes: ParteGasto[], pagos: PagoGrupo[]): Map<string, number> {
  const balances = new Map<string, number>();

  function sumar(userId: string, delta: number) {
    balances.set(userId, (balances.get(userId) ?? 0) + delta);
  }

  for (const gasto of gastos) {
    sumar(gasto.pagadoPor, gasto.monto);
  }
  for (const parte of partes) {
    sumar(parte.userId, -parte.monto);
  }
  for (const pago of pagos) {
    sumar(pago.deUserId, pago.monto);
    sumar(pago.aUserId, -pago.monto);
  }

  return balances;
}

export interface DeudaSugerida {
  de: string;
  a: string;
  monto: number;
}

// Simplifica los saldos netos en la menor cantidad de transferencias posible:
// empareja repetidamente al mayor deudor con el mayor acreedor.
export function simplificarDeudas(balances: Map<string, number>): DeudaSugerida[] {
  const CENTAVO = 0.01;
  const deudores: { userId: string; monto: number }[] = [];
  const acreedores: { userId: string; monto: number }[] = [];

  for (const [userId, balance] of balances) {
    if (balance < -CENTAVO) deudores.push({ userId, monto: -balance });
    else if (balance > CENTAVO) acreedores.push({ userId, monto: balance });
  }

  deudores.sort((a, b) => b.monto - a.monto);
  acreedores.sort((a, b) => b.monto - a.monto);

  const resultado: DeudaSugerida[] = [];
  let i = 0;
  let j = 0;
  while (i < deudores.length && j < acreedores.length) {
    const deudor = deudores[i];
    const acreedor = acreedores[j];
    const monto = Math.min(deudor.monto, acreedor.monto);

    if (monto > CENTAVO) {
      resultado.push({ de: deudor.userId, a: acreedor.userId, monto: Math.round(monto) });
    }

    deudor.monto -= monto;
    acreedor.monto -= monto;

    if (deudor.monto <= CENTAVO) i++;
    if (acreedor.monto <= CENTAVO) j++;
  }

  return resultado;
}
