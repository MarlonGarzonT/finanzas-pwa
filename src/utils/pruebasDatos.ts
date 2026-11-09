// Datos de apoyo para las pruebas (*.test.ts). No se importa desde la app.
import type { Categoria, GastoAnual, Naturaleza, Tipo, Transaccion } from '../types';

export function categoria(id: string, tipo: Tipo, naturaleza: Naturaleza, esFijo = false): Categoria {
  return { id, nombre: id, emoji: '🏷️', tipo, naturaleza, esFijo };
}

let siguienteId = 0;

// `fecha` va en hora local (la zona de las pruebas es America/Bogota).
export function movimiento(
  fecha: Date,
  monto: number,
  categoriaId: string,
  tipo: Tipo = 'egreso',
  prestamoId: string | null = null
): Transaccion {
  siguienteId += 1;
  return { id: `t${siguienteId}`, fecha: fecha.toISOString(), item: 'prueba', categoriaId, tipo, monto, prestamoId };
}

export function gastoAnual(nombre: string, montoEstimado: number, mesVencimiento: number, categoriaId: string | null = null): GastoAnual {
  return { id: nombre, nombre, montoEstimado, mesVencimiento, categoriaId, activo: true };
}

export function buscador(categorias: Categoria[]): (id: string) => Categoria | undefined {
  const mapa = new Map(categorias.map((c) => [c.id, c]));
  return (id) => mapa.get(id);
}
