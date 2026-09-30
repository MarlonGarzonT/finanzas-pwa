import { formatearMonto, formatearMontoCompacto } from './fechas';

const COLOR_TEXTO = '#1d1d1f';
const COLOR_TEXTO_SECUNDARIO = '#6e6e73';
const COLOR_GRID = '#e1e0d9';
const FUENTE = '-apple-system, "Segoe UI", Roboto, Arial, sans-serif';

// Se dibuja a 2x y se escala por CSS para que el PNG embebido en el Excel se
// vea nítido incluso si Excel lo agranda un poco.
const ESCALA = 2;

function crearContexto(anchoCss: number, altoCss: number): CanvasRenderingContext2D {
  const canvas = document.createElement('canvas');
  canvas.width = anchoCss * ESCALA;
  canvas.height = altoCss * ESCALA;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Este navegador no soporta canvas 2D.');
  ctx.scale(ESCALA, ESCALA);
  return ctx;
}

function aBase64PNG(ctx: CanvasRenderingContext2D): string {
  const dataUrl = ctx.canvas.toDataURL('image/png');
  return dataUrl.split(',')[1];
}

// Redondea el máximo del eje a un número "lindo" (1/2/5 × 10^n), como hacen
// las librerías de gráficos, para que las etiquetas del eje no queden con
// decimales raros.
function numeroLindo(maximo: number): number {
  if (maximo <= 0) return 1;
  const potencia = Math.pow(10, Math.floor(Math.log10(maximo)));
  const normalizado = maximo / potencia;
  const lindo = normalizado <= 1 ? 1 : normalizado <= 2 ? 2 : normalizado <= 5 ? 5 : 10;
  return lindo * potencia;
}

// Rectángulo con las esquinas superiores redondeadas (para columnas verticales).
function columnaRedondeada(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  if (h <= 0) return;
  const radio = Math.min(r, w / 2, h);
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + radio);
  ctx.arcTo(x, y, x + radio, y, radio);
  ctx.lineTo(x + w - radio, y);
  ctx.arcTo(x + w, y, x + w, y + radio, radio);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.fill();
}

// Rectángulo con las esquinas derechas redondeadas (para barras horizontales).
function barraRedondeada(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  if (w <= 0) return;
  const radio = Math.min(r, h / 2, w);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w - radio, y);
  ctx.arcTo(x + w, y, x + w, y + radio, radio);
  ctx.lineTo(x + w, y + h - radio);
  ctx.arcTo(x + w, y + h, x + w - radio, y + h, radio);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.fill();
}

export interface PuntoMensual {
  etiqueta: string;
  ingreso: number;
  egreso: number;
}

// Comparativo de ingresos vs egresos por mes: dos series (categórico, color
// reservado ingreso=verde/egreso=rojo, igual que el resto de la app), en
// columnas agrupadas, con leyenda y ejes con líneas de referencia.
export function dibujarComparativoMensual(datos: PuntoMensual[]): string {
  const ancho = 760;
  const alto = 300;
  const ctx = crearContexto(ancho, alto);
  ctx.clearRect(0, 0, ancho, alto);
  ctx.textBaseline = 'middle';

  const margen = { arriba: 30, derecha: 16, abajo: 26, izquierda: 58 };
  const anchoPlot = ancho - margen.izquierda - margen.derecha;
  const altoPlot = alto - margen.arriba - margen.abajo;

  const maximoDatos = Math.max(1, ...datos.flatMap((d) => [d.ingreso, d.egreso]));
  const techo = numeroLindo(maximoDatos);
  const pasosEje = 4;

  // Leyenda
  ctx.font = `600 12px ${FUENTE}`;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#34c759';
  ctx.fillRect(margen.izquierda, 8, 10, 10);
  ctx.fillStyle = COLOR_TEXTO_SECUNDARIO;
  ctx.fillText('Ingresos', margen.izquierda + 15, 14);
  ctx.fillStyle = '#ff3b30';
  ctx.fillRect(margen.izquierda + 92, 8, 10, 10);
  ctx.fillStyle = COLOR_TEXTO_SECUNDARIO;
  ctx.fillText('Egresos', margen.izquierda + 107, 14);

  // Líneas de referencia + etiquetas del eje Y
  ctx.font = `11px ${FUENTE}`;
  ctx.strokeStyle = COLOR_GRID;
  ctx.lineWidth = 1;
  ctx.textAlign = 'right';
  for (let paso = 0; paso <= pasosEje; paso++) {
    const valor = (techo / pasosEje) * paso;
    const y = margen.arriba + altoPlot - (valor / techo) * altoPlot;
    ctx.beginPath();
    ctx.moveTo(margen.izquierda, Math.round(y) + 0.5);
    ctx.lineTo(ancho - margen.derecha, Math.round(y) + 0.5);
    ctx.stroke();
    ctx.fillStyle = COLOR_TEXTO_SECUNDARIO;
    ctx.fillText(formatearMontoCompacto(valor), margen.izquierda - 8, y);
  }

  // Columnas agrupadas
  const anchoGrupo = anchoPlot / Math.max(1, datos.length);
  const anchoColumna = Math.max(4, Math.min(16, anchoGrupo / 3));
  const separacion = 3;

  ctx.font = `11px ${FUENTE}`;
  datos.forEach((d, i) => {
    const centro = margen.izquierda + anchoGrupo * i + anchoGrupo / 2;
    const xIngreso = centro - anchoColumna - separacion / 2;
    const xEgreso = centro + separacion / 2;
    const hIngreso = (d.ingreso / techo) * altoPlot;
    const hEgreso = (d.egreso / techo) * altoPlot;
    const base = margen.arriba + altoPlot;

    ctx.fillStyle = '#34c759';
    columnaRedondeada(ctx, xIngreso, base - hIngreso, anchoColumna, hIngreso, 3);
    ctx.fillStyle = '#ff3b30';
    columnaRedondeada(ctx, xEgreso, base - hEgreso, anchoColumna, hEgreso, 3);

    ctx.fillStyle = COLOR_TEXTO_SECUNDARIO;
    ctx.textAlign = 'center';
    ctx.fillText(d.etiqueta, centro, base + 13);
  });

  // Eje base
  ctx.strokeStyle = COLOR_GRID;
  ctx.beginPath();
  const yBase = margen.arriba + altoPlot;
  ctx.moveTo(margen.izquierda, yBase);
  ctx.lineTo(ancho - margen.derecha, yBase);
  ctx.stroke();

  return aBase64PNG(ctx);
}

export interface PuntoCategoria {
  nombre: string;
  valor: number;
  color: string;
}

// Gasto por categoría: una sola serie (el color identifica cada categoría,
// igual que los chips de la app), en barras horizontales -- más fácil de
// comparar que una dona cuando hay varias categorías con nombres largos.
export function dibujarGastosPorCategoria(datos: PuntoCategoria[]): string {
  const ancho = 760;
  const altoFila = 32;
  const alto = Math.max(80, datos.length * altoFila + 16);
  const ctx = crearContexto(ancho, alto);
  ctx.clearRect(0, 0, ancho, alto);
  ctx.textBaseline = 'middle';

  const margen = { izquierda: 160, derecha: 100 };
  const anchoPlot = ancho - margen.izquierda - margen.derecha;
  const maximo = Math.max(1, ...datos.map((d) => d.valor));

  datos.forEach((d, i) => {
    const y = 8 + i * altoFila;
    const altoBarra = 18;
    const anchoBarra = (d.valor / maximo) * anchoPlot;

    ctx.font = `500 12px ${FUENTE}`;
    ctx.fillStyle = COLOR_TEXTO;
    ctx.textAlign = 'right';
    ctx.fillText(d.nombre, margen.izquierda - 12, y + altoFila / 2);

    ctx.fillStyle = d.color;
    barraRedondeada(ctx, margen.izquierda, y + (altoFila - altoBarra) / 2, Math.max(3, anchoBarra), altoBarra, 4);

    ctx.font = `600 12px ${FUENTE}`;
    ctx.fillStyle = COLOR_TEXTO_SECUNDARIO;
    ctx.textAlign = 'left';
    ctx.fillText(formatearMonto(d.valor), margen.izquierda + anchoBarra + 8, y + altoFila / 2);
  });

  return aBase64PNG(ctx);
}
