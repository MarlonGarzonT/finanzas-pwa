export type Tipo = 'ingreso' | 'egreso';

export interface Categoria {
  id: string;
  nombre: string;
  emoji: string;
  tipo: Tipo;
  esFijo: boolean;
}

export interface CambiosCategoria {
  nombre?: string;
  emoji?: string;
  tipo?: Tipo;
  esFijo?: boolean;
}

export interface Transaccion {
  id: string;
  fecha: string; // ISO
  item: string;
  categoriaId: string;
  tipo: Tipo;
  monto: number;
  semanaDelMes: number;
}

export interface NuevaTransaccion {
  item: string;
  categoriaId: string;
  tipo: Tipo;
  monto: number;
}

// --- Grupos: gastos compartidos con otras personas (cada quien con su cuenta) ---

export interface Grupo {
  id: string;
  nombre: string;
  codigo: string;
  creadoPor: string;
}

export interface MiembroGrupo {
  grupoId: string;
  userId: string;
  nombreVisible: string;
}

export interface GastoGrupo {
  id: string;
  grupoId: string;
  pagadoPor: string;
  descripcion: string;
  monto: number;
  fecha: string; // ISO
  creadoPor: string;
}

export interface ParteGasto {
  gastoId: string;
  userId: string;
  monto: number;
}

export interface PagoGrupo {
  id: string;
  grupoId: string;
  deUserId: string;
  aUserId: string;
  monto: number;
  fecha: string; // ISO
}

export interface ParteNuevoGasto {
  userId: string;
  monto: number;
}

export interface NuevoGastoGrupo {
  grupoId: string;
  descripcion: string;
  monto: number;
  pagadoPor: string;
  partes: ParteNuevoGasto[];
}

export interface DetalleGrupo {
  miembros: MiembroGrupo[];
  gastos: GastoGrupo[];
  partes: ParteGasto[];
  pagos: PagoGrupo[];
}
