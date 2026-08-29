export type Tipo = 'ingreso' | 'egreso';

export interface Categoria {
  id: string;
  nombre: string;
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
