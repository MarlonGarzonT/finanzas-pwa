export type Tipo = 'ingreso' | 'egreso';

// Cómo cuenta cada movimiento en las métricas, más allá de si entra o sale
// plata (ver utils/contabilidad.ts). Las de egreso solo valen para
// categorías de egreso y las de ingreso para las de ingreso.
export type NaturalezaEgreso = 'esencial' | 'discrecional' | 'deuda' | 'ahorro' | 'pago_tarjeta';
export type NaturalezaIngreso = 'ordinario' | 'extraordinario' | 'prestamo_reembolso';
export type Naturaleza = NaturalezaEgreso | NaturalezaIngreso;

export interface Categoria {
  id: string;
  nombre: string;
  emoji: string;
  tipo: Tipo;
  naturaleza: Naturaleza;
  esFijo: boolean;
}

export interface CambiosCategoria {
  nombre?: string;
  emoji?: string;
  tipo?: Tipo;
  naturaleza?: Naturaleza;
  esFijo?: boolean;
}

export interface Transaccion {
  id: string;
  fecha: string; // ISO
  item: string;
  categoriaId: string;
  tipo: Tipo;
  monto: number;
  // Si es la salida de un préstamo (egreso) o un abono que te hicieron
  // (ingreso). Esos movimientos no son gasto ni ingreso: ver contabilidad.ts.
  prestamoId: string | null;
  // Si es el pago de una cuota de un crédito tuyo (egreso). Cuenta como gasto
  // de deuda y se muestra en Préstamos → Debes: ver utils/creditos.ts.
  creditoId: string | null;
}

export interface NuevaTransaccion {
  item: string;
  categoriaId: string;
  tipo: Tipo;
  monto: number;
}

// Gasto que llega una vez al año (SOAT, predial, matrícula...). Si tiene
// categoría vinculada, un egreso de esa categoría en el mes de vencimiento
// cuenta como su pago.
export interface GastoAnual {
  id: string;
  nombre: string;
  montoEstimado: number;
  // 1 = enero ... 12 = diciembre.
  mesVencimiento: number;
  categoriaId: string | null;
  activo: boolean;
}

export type NuevoGastoAnual = Omit<GastoAnual, 'id'>;

// Plata que le prestaste a alguien. Lo que falta por cobrar no se guarda: sale
// de restarle al monto los abonos (movimientos de ingreso con su prestamoId).
export interface Prestamo {
  id: string;
  persona: string;
  monto: number;
  // Día en que quedó de pagarte, en hora de Colombia: 'AAAA-MM-DD'.
  fechaDevolucion: string;
  nota: string | null;
}

export interface NuevoPrestamo {
  persona: string;
  monto: number;
  fechaDevolucion: string;
  nota: string | null;
}

// Crédito de cuota fija que tú pagas (moto, carro, vivienda, libre inversión).
// Se guarda lo que el usuario sabe de su contrato; los intereses, la tasa y el
// saldo no se guardan: salen de calcularlos (utils/creditos.ts) y de los pagos
// registrados (movimientos de egreso con su creditoId).
export interface Credito {
  id: string;
  nombre: string;
  entidad: string | null;
  // Lo que el banco prestó (el capital), sin intereses.
  montoFinanciado: number;
  cuota: number;
  plazoMeses: number;
  // Cuotas que ya estaban pagadas cuando empezó a llevarlo en la app.
  cuotasPagadasInicial: number;
  // Día de vencimiento de la cuota 1, hora de Colombia: 'AAAA-MM-DD'. La
  // cuota n vence ese mismo día n-1 meses después.
  fechaPrimeraCuota: string;
}

export interface NuevoCredito {
  nombre: string;
  entidad: string | null;
  montoFinanciado: number;
  cuota: number;
  plazoMeses: number;
  cuotasPagadasInicial: number;
  fechaPrimeraCuota: string;
}
