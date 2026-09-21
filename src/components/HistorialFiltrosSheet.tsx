import { useEffect, useState } from 'react';
import { SelectorMesSheet } from './SelectorMesSheet';
import type { Categoria, Tipo } from '../types';
import { FILTROS_INICIALES, type FiltrosHistorial } from '../utils/filtrosHistorial';
import { nombreMes } from '../utils/fechas';
import './HistorialFiltrosSheet.css';
import '../components/NuevoMovimientoSheet.css';
import { useBloqueoDeFondo, useGestosSheet } from './useComportamientoSheet';

interface Props {
  abierto: boolean;
  categorias: Categoria[];
  filtros: FiltrosHistorial;
  onCerrar: () => void;
  onAplicar: (filtros: FiltrosHistorial) => void;
}

function capitalizarPrimera(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function HistorialFiltrosSheet({ abierto, categorias, filtros, onCerrar, onAplicar }: Props) {
  const [draft, setDraft] = useState<FiltrosHistorial>(filtros);
  const [ruedaMesAbierta, setRuedaMesAbierta] = useState(false);

  useBloqueoDeFondo(abierto);
  const gestos = useGestosSheet(abierto, onCerrar);

  // Al reabrir el sheet, arranca desde los filtros que realmente están
  // aplicados (por si se cerró sin aplicar los cambios en el intento anterior).
  useEffect(() => {
    if (abierto) setDraft(filtros);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al abrir
  }, [abierto]);

  if (!abierto) return null;

  function alternarCategoria(id: string) {
    setDraft((prev) => {
      const copia = new Set(prev.categoriaIds);
      if (copia.has(id)) copia.delete(id);
      else copia.add(id);
      return { ...prev, categoriaIds: copia };
    });
  }

  function cambiarTipo(tipo: Tipo | 'todos') {
    setDraft((prev) => ({ ...prev, tipo }));
  }

  function manejarAplicar() {
    onAplicar(draft);
    onCerrar();
  }

  function manejarLimpiar() {
    setDraft(FILTROS_INICIALES);
  }

  return (
    <div className="sheet-overlay" onClick={onCerrar} style={gestos.overlayStyle}>
      <div
        className={`sheet ${gestos.arrastrando ? 'sheet--arrastrando' : ''}`}
        onClick={(e) => e.stopPropagation()}
        onFocusCapture={gestos.onFocusCaptureSheet}
        style={gestos.sheetStyle}
      >
        <div className="sheet__header">
          <div
            className="sheet__handle-area"
            onPointerDown={gestos.onPointerDownHandle}
            onPointerMove={gestos.onPointerMoveHandle}
            onPointerUp={gestos.onPointerUpHandle}
            onPointerCancel={gestos.onPointerUpHandle}
          >
            <div className="sheet__handle" />
          </div>
          <h2 className="sheet__titulo">Filtros</h2>
        </div>

        <div className="filtros-sheet__seccion">
          <p className="filtros-sheet__etiqueta">Tipo</p>
          <div className="chips">
            {(['todos', 'ingreso', 'egreso'] as const).map((t) => (
              <button
                key={t}
                type="button"
                className={`chip ${draft.tipo === t ? 'chip--activo' : ''}`}
                onClick={() => cambiarTipo(t)}
              >
                {t === 'todos' ? 'Todos' : t === 'ingreso' ? 'Ingresos' : 'Gastos'}
              </button>
            ))}
          </div>
        </div>

        <div className="filtros-sheet__seccion">
          <p className="filtros-sheet__etiqueta">Categorías</p>
          <div className="chips">
            {categorias.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`chip ${draft.categoriaIds.has(c.id) ? 'chip--activo' : ''}`}
                onClick={() => alternarCategoria(c.id)}
              >
                <span aria-hidden>{c.emoji}</span>
                {c.nombre}
              </button>
            ))}
          </div>
        </div>

        <div className="filtros-sheet__seccion">
          <p className="filtros-sheet__etiqueta">Mes</p>
          <button
            type="button"
            className="filtros-sheet__mes-boton"
            onClick={() => setRuedaMesAbierta(true)}
          >
            {draft.mes ? capitalizarPrimera(nombreMes(draft.mes)) : 'Todos los meses'}
          </button>
          {draft.mes && (
            <button
              type="button"
              className="filtros-sheet__mes-limpiar"
              onClick={() => setDraft((prev) => ({ ...prev, mes: null }))}
            >
              Ver todos los meses
            </button>
          )}
        </div>

        <div className="filtros-sheet__seccion">
          <p className="filtros-sheet__etiqueta">Monto</p>
          <div className="filtros-sheet__rango">
            <input
              className="texto-input"
              inputMode="numeric"
              placeholder="Mínimo"
              value={draft.montoMin !== null ? draft.montoMin.toLocaleString('es-CO') : ''}
              onChange={(e) => {
                const digitos = e.target.value.replace(/\D/g, '');
                setDraft((prev) => ({ ...prev, montoMin: digitos ? Number(digitos) : null }));
              }}
            />
            <input
              className="texto-input"
              inputMode="numeric"
              placeholder="Máximo"
              value={draft.montoMax !== null ? draft.montoMax.toLocaleString('es-CO') : ''}
              onChange={(e) => {
                const digitos = e.target.value.replace(/\D/g, '');
                setDraft((prev) => ({ ...prev, montoMax: digitos ? Number(digitos) : null }));
              }}
            />
          </div>
        </div>

        <label className="interruptor-fila">
          <span>📌 Solo gastos fijos</span>
          <span className="interruptor">
            <input
              type="checkbox"
              checked={draft.soloFijos}
              onChange={(e) => setDraft((prev) => ({ ...prev, soloFijos: e.target.checked }))}
            />
            <span className="interruptor__riel" />
          </span>
        </label>

        <div className="filtros-sheet__seccion">
          <p className="filtros-sheet__etiqueta">Ordenar por</p>
          <div className="chips">
            <button
              type="button"
              className={`chip ${draft.orden === 'fecha' ? 'chip--activo' : ''}`}
              onClick={() => setDraft((prev) => ({ ...prev, orden: 'fecha' }))}
            >
              Más reciente
            </button>
            <button
              type="button"
              className={`chip ${draft.orden === 'monto' ? 'chip--activo' : ''}`}
              onClick={() => setDraft((prev) => ({ ...prev, orden: 'monto' }))}
            >
              Mayor monto
            </button>
          </div>
        </div>

        <button className="btn-primario" onClick={manejarAplicar}>
          Aplicar filtros
        </button>
        <button className="btn-cancelar" onClick={manejarLimpiar}>
          Limpiar filtros
        </button>
      </div>

      <SelectorMesSheet
        abierto={ruedaMesAbierta}
        mes={draft.mes ?? new Date()}
        onCerrar={() => setRuedaMesAbierta(false)}
        onSeleccionar={(mes) => setDraft((prev) => ({ ...prev, mes }))}
        anidado
      />
    </div>
  );
}
