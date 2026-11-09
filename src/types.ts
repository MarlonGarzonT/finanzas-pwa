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
