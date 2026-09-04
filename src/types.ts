export type Tipo = 'ingreso' | 'egreso';

export interface Categoria {
  id: string;
  nombre: string;
  emoji: string;
  tipo: Tipo;
  esFijo: boolean;
}

export interface CambiosCategoria {
  emoji?: string;
  tipo?: Tipo;
  esFijo?: boolean;
}

export interface Transaccion {
  id: string;
  fecha: string; // ISO
  item: string;
  categoriaId: string | null; // null cuando la categoría original fue eliminada
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
