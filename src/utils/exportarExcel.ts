import type { ConditionalFormattingRule } from 'exceljs';
import type { Categoria, Transaccion } from '../types';
import {
  claveMes,
  formatearFecha,
  formatearMonto,
  formatearMontoConSigno,
  nombreMesCorto,
} from './fechas';
import { dibujarComparativoMensual, dibujarGastosPorCategoria, type PuntoCategoria, type PuntoMensual } from './graficosExcel';

// Misma paleta e igual algoritmo de asignación que utils/colorCategoria.ts,
// para que el color de cada categoría coincida con el que ya ve el usuario
// en la app (chips, dona de categorías). Se duplica en hexadecimal porque
// colorCategoria.ts devuelve variables CSS (var(--color-sky)), que no sirven
// para pintar una celda o un canvas fuera del navegador con estilos.
const PALETA_CATEGORIAS = ['#0a84ff', '#ff9500', '#af52de', '#30b0c7', '#ff375f', '#05ad98', '#ffcc00', '#a2845e'];
function colorCategoriaHex(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return PALETA_CATEGORIAS[hash % PALETA_CATEGORIAS.length];
}

const ARGB_MARCA = 'FF0066CC';
const ARGB_MARCA_TINTE = 'FFE3EFFB';
const ARGB_INGRESO = 'FF34C759';
const ARGB_INGRESO_TINTE = 'FFE5F7EA';
const ARGB_EGRESO = 'FFFF3B30';
const ARGB_EGRESO_TINTE = 'FFFFE9E7';
const ARGB_BLANCO = 'FFFFFFFF';
const ARGB_TEXTO = 'FF1D1D1F';
const ARGB_TEXTO_SECUNDARIO = 'FF6E6E73';
const ARGB_ZEBRA = 'FFF7F7F8';
const FUENTE = 'Segoe UI';

function capitalizarPrimera(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function descargarBuffer(buffer: BlobPart, nombreArchivo: string): void {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivo;
  enlace.click();
  URL.revokeObjectURL(url);
}

export async function exportarTransaccionesExcel(
  transacciones: Transaccion[],
  categoriaPorId: (id: string) => Categoria | undefined
): Promise<void> {
  // Import perezoso: ExcelJS pesa bastante y solo hace falta cuando el
  // usuario realmente exporta, no en cada carga de la app.
  // Según cómo empaquete el bundle (o quién ejecute el módulo), el namespace
  // real a veces llega directo y a veces anidado en `.default`: se cubren
  // ambos casos en vez de asumir uno solo.
  const modulo = await import('exceljs');
  const ExcelJS = (modulo as unknown as { default?: typeof modulo }).default ?? modulo;

  const ordenadas = [...transacciones].sort(
    (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
  );

  const totalIngresos = transacciones.filter((t) => t.tipo === 'ingreso').reduce((acc, t) => acc + t.monto, 0);
  const totalEgresos = transacciones.filter((t) => t.tipo === 'egreso').reduce((acc, t) => acc + t.monto, 0);
  const balance = totalIngresos - totalEgresos;

  // ---- Agregado por mes (para la tabla y el gráfico comparativo) ----
  const porMes = new Map<string, { etiqueta: string; ingreso: number; egreso: number; orden: number }>();
  for (const t of ordenadas) {
    const clave = claveMes(t.fecha);
    if (!porMes.has(clave)) {
      const fecha = new Date(t.fecha);
      porMes.set(clave, {
        etiqueta: capitalizarPrimera(nombreMesCorto(fecha)),
        ingreso: 0,
        egreso: 0,
        orden: fecha.getFullYear() * 12 + fecha.getMonth(),
      });
    }
    const fila = porMes.get(clave)!;
    if (t.tipo === 'ingreso') fila.ingreso += t.monto;
    else fila.egreso += t.monto;
  }
  const mesesOrdenados = Array.from(porMes.values()).sort((a, b) => a.orden - b.orden);

  // ---- Agregado por categoría (para la tabla y el gráfico de gastos) ----
  const porCategoria = new Map<string, { nombre: string; tipo: 'ingreso' | 'egreso'; total: number; conteo: number }>();
  for (const t of ordenadas) {
    if (!porCategoria.has(t.categoriaId)) {
      const cat = categoriaPorId(t.categoriaId);
      porCategoria.set(t.categoriaId, { nombre: cat?.nombre ?? 'Otros', tipo: t.tipo, total: 0, conteo: 0 });
    }
    const fila = porCategoria.get(t.categoriaId)!;
    fila.total += t.monto;
    fila.conteo += 1;
  }
  const gastosOrdenados = Array.from(porCategoria.entries())
    .filter(([, c]) => c.tipo === 'egreso')
    .sort((a, b) => b[1].total - a[1].total);

  const TOP_CATEGORIAS = 8;
  const topGastos: PuntoCategoria[] = gastosOrdenados.slice(0, TOP_CATEGORIAS).map(([id, c]) => ({
    nombre: c.nombre,
    valor: c.total,
    color: colorCategoriaHex(id),
  }));
  if (gastosOrdenados.length > TOP_CATEGORIAS) {
    const restoTotal = gastosOrdenados.slice(TOP_CATEGORIAS).reduce((acc, [, c]) => acc + c.total, 0);
    topGastos.push({ nombre: 'Otros', valor: restoTotal, color: '#898781' });
  }

  const puntosMensuales: PuntoMensual[] = mesesOrdenados.slice(-12).map((m) => ({
    etiqueta: m.etiqueta,
    ingreso: m.ingreso,
    egreso: m.egreso,
  }));

  // ================= Workbook =================
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Mis Finanzas';
  workbook.created = new Date();

  // ---------------- Hoja "Resumen" ----------------
  const resumen = workbook.addWorksheet('Resumen', {
    views: [{ showGridLines: false }],
  });
  resumen.columns = [{ width: 22 }, { width: 22 }, { width: 22 }, { width: 22 }, { width: 22 }, { width: 22 }];

  resumen.mergeCells('A1:F1');
  const celdaTitulo = resumen.getCell('A1');
  celdaTitulo.value = 'Mis Finanzas — Reporte de movimientos';
  celdaTitulo.font = { name: FUENTE, size: 18, bold: true, color: { argb: ARGB_BLANCO } };
  celdaTitulo.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ARGB_MARCA } };
  celdaTitulo.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  resumen.getRow(1).height = 34;

  const primerFecha = ordenadas[0] ? formatearFecha(ordenadas[0].fecha) : '—';
  const ultimaFecha = ordenadas[ordenadas.length - 1] ? formatearFecha(ordenadas[ordenadas.length - 1].fecha) : '—';
  resumen.mergeCells('A2:F2');
  const celdaSubtitulo = resumen.getCell('A2');
  celdaSubtitulo.value = `Generado el ${formatearFecha(new Date().toISOString())} · ${transacciones.length} movimientos · ${primerFecha} a ${ultimaFecha}`;
  celdaSubtitulo.font = { name: FUENTE, size: 10, italic: true, color: { argb: ARGB_TEXTO_SECUNDARIO } };
  celdaSubtitulo.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  resumen.getRow(2).height = 20;

  // --- Tarjetas KPI ---
  function tarjetaKpi(colInicio: number, colFin: number, etiqueta: string, valorTexto: string, argbTinte: string, argbTexto: string) {
    const filaEtiqueta = resumen.getRow(4);
    const filaValor = resumen.getRow(5);
    const rangoEtiqueta = `${resumen.getColumn(colInicio).letter}4:${resumen.getColumn(colFin).letter}4`;
    const rangoValor = `${resumen.getColumn(colInicio).letter}5:${resumen.getColumn(colFin).letter}5`;
    resumen.mergeCells(rangoEtiqueta);
    resumen.mergeCells(rangoValor);

    const cEtiqueta = resumen.getCell(rangoEtiqueta.split(':')[0]);
    cEtiqueta.value = etiqueta.toUpperCase();
    cEtiqueta.font = { name: FUENTE, size: 10, bold: true, color: { argb: ARGB_TEXTO_SECUNDARIO } };
    cEtiqueta.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argbTinte } };
    cEtiqueta.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

    const cValor = resumen.getCell(rangoValor.split(':')[0]);
    cValor.value = valorTexto;
    cValor.font = { name: FUENTE, size: 20, bold: true, color: { argb: argbTexto } };
    cValor.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argbTinte } };
    cValor.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

    filaEtiqueta.height = 18;
    filaValor.height = 30;
  }

  tarjetaKpi(1, 2, 'Ingresos totales', formatearMontoConSigno(totalIngresos), ARGB_INGRESO_TINTE, ARGB_INGRESO);
  tarjetaKpi(3, 4, 'Egresos totales', `-${formatearMonto(totalEgresos)}`, ARGB_EGRESO_TINTE, ARGB_EGRESO);
  tarjetaKpi(
    5,
    6,
    'Balance',
    formatearMontoConSigno(balance),
    ARGB_MARCA_TINTE,
    balance >= 0 ? ARGB_INGRESO : ARGB_EGRESO
  );

  let fila = 7;

  // --- Sección: resumen mensual ---
  resumen.getCell(`A${fila}`).value = 'Resumen mensual';
  resumen.getCell(`A${fila}`).font = { name: FUENTE, size: 13, bold: true, color: { argb: ARGB_TEXTO } };
  fila += 1;

  const encabezadosMes = ['Mes', 'Ingresos', 'Egresos', 'Balance'];
  encabezadosMes.forEach((texto, i) => {
    const celda = resumen.getCell(fila, i + 1);
    celda.value = texto;
    celda.font = { name: FUENTE, size: 11, bold: true, color: { argb: ARGB_BLANCO } };
    celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ARGB_MARCA } };
    celda.alignment = { vertical: 'middle', horizontal: i === 0 ? 'left' : 'right' };
  });
  fila += 1;

  const filaInicioMeses = fila;
  for (const m of mesesOrdenados) {
    const balanceMes = m.ingreso - m.egreso;
    resumen.getCell(fila, 1).value = m.etiqueta;
    resumen.getCell(fila, 2).value = m.ingreso;
    resumen.getCell(fila, 3).value = m.egreso;
    resumen.getCell(fila, 4).value = balanceMes;
    for (let col = 2; col <= 4; col++) {
      const celda = resumen.getCell(fila, col);
      celda.numFmt = '"$"#,##0';
      celda.alignment = { horizontal: 'right' };
    }
    if (fila % 2 === filaInicioMeses % 2) {
      for (let col = 1; col <= 4; col++) {
        resumen.getCell(fila, col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ARGB_ZEBRA } };
      }
    }
    fila += 1;
  }
  const filaFinMeses = fila - 1;

  if (filaFinMeses >= filaInicioMeses) {
    // Barra de datos nativa de Excel sobre el balance mensual: la misma idea
    // que el color de una barra de progreso, pero editable/filtrable en Excel.
    resumen.addConditionalFormatting({
      ref: `D${filaInicioMeses}:D${filaFinMeses}`,
      rules: [
        {
          type: 'dataBar',
          priority: 1,
          cfvo: [{ type: 'min' }, { type: 'max' }],
          gradient: false,
          border: false,
          // `color` no está en los tipos de exceljs pero sí lo serializa su
          // XML (ver lib/xlsx/xform/sheet/cf/databar-xform.js); de ahí el `as`.
          color: { argb: ARGB_MARCA },
        } as ConditionalFormattingRule,
      ],
    });
  }
  fila += 2;

  if (puntosMensuales.length > 0) {
    resumen.getCell(`A${fila}`).value =
      mesesOrdenados.length > 12 ? 'Ingresos vs. egresos (últimos 12 meses)' : 'Ingresos vs. egresos por mes';
    resumen.getCell(`A${fila}`).font = { name: FUENTE, size: 11, bold: true, color: { argb: ARGB_TEXTO_SECUNDARIO } };
    fila += 1;

    const imagenMensual = dibujarComparativoMensual(puntosMensuales);
    const idImagenMensual = workbook.addImage({ base64: imagenMensual, extension: 'png' });
    resumen.addImage(idImagenMensual, {
      tl: { col: 0, row: fila - 1 },
      ext: { width: 700, height: 276 },
    });
    fila += Math.ceil(276 / 20) + 2;
  }

  // --- Sección: gastos por categoría ---
  resumen.getCell(`A${fila}`).value = 'Gastos por categoría';
  resumen.getCell(`A${fila}`).font = { name: FUENTE, size: 13, bold: true, color: { argb: ARGB_TEXTO } };
  fila += 1;

  if (topGastos.length > 0) {
    const imagenCategorias = dibujarGastosPorCategoria(topGastos);
    const idImagenCategorias = workbook.addImage({ base64: imagenCategorias, extension: 'png' });
    const altoImagen = Math.max(80, topGastos.length * 32 + 16);
    resumen.addImage(idImagenCategorias, {
      tl: { col: 0, row: fila - 1 },
      ext: { width: 700, height: altoImagen },
    });
  } else {
    resumen.getCell(`A${fila}`).value = 'Aún no hay gastos registrados.';
    resumen.getCell(`A${fila}`).font = { name: FUENTE, size: 11, color: { argb: ARGB_TEXTO_SECUNDARIO } };
  }

  // ---------------- Hoja "Movimientos" ----------------
  const hojaMovimientos = workbook.addWorksheet('Movimientos', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });
  hojaMovimientos.columns = [
    { header: 'Fecha', key: 'fecha', width: 14 },
    { header: 'Tipo', key: 'tipo', width: 12 },
    { header: 'Categoría', key: 'categoria', width: 20 },
    { header: 'Descripción', key: 'descripcion', width: 34 },
    { header: 'Monto', key: 'monto', width: 16 },
    { header: 'Semana del mes', key: 'semana', width: 16 },
  ];

  const filaEncabezadoMov = hojaMovimientos.getRow(1);
  filaEncabezadoMov.eachCell((celda) => {
    celda.font = { name: FUENTE, size: 11, bold: true, color: { argb: ARGB_BLANCO } };
    celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ARGB_MARCA } };
    celda.alignment = { vertical: 'middle' };
  });
  filaEncabezadoMov.height = 22;

  ordenadas.forEach((t, i) => {
    const cat = categoriaPorId(t.categoriaId);
    const filaExcel = hojaMovimientos.addRow({
      fecha: new Date(t.fecha),
      tipo: t.tipo === 'ingreso' ? 'Ingreso' : 'Gasto',
      categoria: cat?.nombre ?? 'Otros',
      descripcion: t.item,
      monto: t.tipo === 'ingreso' ? t.monto : -t.monto,
      semana: t.semanaDelMes,
    });
    filaExcel.getCell('fecha').numFmt = 'dd/mm/yyyy';
    filaExcel.getCell('monto').numFmt = '"$"#,##0;-"$"#,##0';
    filaExcel.getCell('monto').font = {
      name: FUENTE,
      bold: true,
      color: { argb: t.tipo === 'ingreso' ? ARGB_INGRESO : ARGB_EGRESO },
    };
    filaExcel.getCell('tipo').font = {
      name: FUENTE,
      color: { argb: t.tipo === 'ingreso' ? ARGB_INGRESO : ARGB_EGRESO },
    };
    if (i % 2 === 1) {
      filaExcel.eachCell({ includeEmpty: true }, (celda) => {
        if (!celda.fill) celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ARGB_ZEBRA } };
      });
    }
  });

  if (ordenadas.length > 0) {
    hojaMovimientos.autoFilter = { from: 'A1', to: `F${ordenadas.length + 1}` };
  }

  // ---------------- Hoja "Categorías" ----------------
  const hojaCategorias = workbook.addWorksheet('Categorías', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });
  hojaCategorias.columns = [
    { header: 'Categoría', key: 'categoria', width: 22 },
    { header: 'Tipo', key: 'tipo', width: 12 },
    { header: 'Total', key: 'total', width: 16 },
    { header: 'Movimientos', key: 'conteo', width: 14 },
  ];
  hojaCategorias.getRow(1).eachCell((celda) => {
    celda.font = { name: FUENTE, size: 11, bold: true, color: { argb: ARGB_BLANCO } };
    celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ARGB_MARCA } };
  });
  hojaCategorias.getRow(1).height = 22;

  const categoriasOrdenadas = Array.from(porCategoria.entries()).sort((a, b) => {
    if (a[1].tipo !== b[1].tipo) return a[1].tipo === 'ingreso' ? -1 : 1;
    return b[1].total - a[1].total;
  });

  const filaInicioCategorias = 2;
  categoriasOrdenadas.forEach(([, c], i) => {
    const filaExcel = hojaCategorias.addRow({
      categoria: c.nombre,
      tipo: c.tipo === 'ingreso' ? 'Ingreso' : 'Gasto',
      total: c.total,
      conteo: c.conteo,
    });
    filaExcel.getCell('total').numFmt = '"$"#,##0';
    filaExcel.getCell('tipo').font = { name: FUENTE, color: { argb: c.tipo === 'ingreso' ? ARGB_INGRESO : ARGB_EGRESO } };
    if (i % 2 === 1) {
      filaExcel.eachCell({ includeEmpty: true }, (celda) => {
        if (!celda.fill) celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ARGB_ZEBRA } };
      });
    }
  });
  const filaFinCategorias = filaInicioCategorias + categoriasOrdenadas.length - 1;
  if (filaFinCategorias >= filaInicioCategorias) {
    hojaCategorias.addConditionalFormatting({
      ref: `C${filaInicioCategorias}:C${filaFinCategorias}`,
      rules: [
        {
          type: 'dataBar',
          priority: 1,
          cfvo: [{ type: 'min' }, { type: 'max' }],
          gradient: false,
          border: false,
          color: { argb: ARGB_MARCA },
        } as ConditionalFormattingRule,
      ],
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  descargarBuffer(buffer, `movimientos-${new Date().toISOString().slice(0, 10)}.xlsx`);
}
