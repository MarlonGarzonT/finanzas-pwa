import { BlockTitle, Button, List, ListItem, Toggle } from 'konsta/react';
import { useEffect, useState } from 'react';
import { useCategoriasPorUso } from '../data/useCategoriasPorUso';
import type { Categoria, Tipo } from '../types';
import { capitalizarPrimera, nombreMes } from '../utils/fechas';
import { FILTROS_INICIALES, type FiltrosHistorial } from '../utils/filtrosHistorial';
import { HojaInferior } from './HojaInferior';
import { SelectorCategoria } from './SelectorCategoria';
import { SelectorMesSheet } from './SelectorMesSheet';
import { OpcionSelector, SelectorVidrio } from './SelectorVidrio';

interface Props {
  abierto: boolean;
  categorias: Categoria[];
  filtros: FiltrosHistorial;
  onCerrar: () => void;
  onAplicar: (filtros: FiltrosHistorial) => void;
}

const TIPOS: { valor: Tipo | 'todos'; etiqueta: string }[] = [
  { valor: 'todos', etiqueta: 'Todos' },
  { valor: 'egreso', etiqueta: 'Gastos' },
  { valor: 'ingreso', etiqueta: 'Ingresos' },
];

function textoAMonto(texto: string): number | null {
  const digitos = texto.replace(/\D/g, '');
  return digitos ? Number(digitos) : null;
}

export function HistorialFiltrosSheet({ abierto, categorias, filtros, onCerrar, onAplicar }: Props) {
  const [draft, setDraft] = useState<FiltrosHistorial>(filtros);
  const [ruedaMesAbierta, setRuedaMesAbierta] = useState(false);
  const gastosPorUso = useCategoriasPorUso(categorias, 'egreso');
  const ingresosPorUso = useCategoriasPorUso(categorias, 'ingreso');

  // Al reabrir el sheet, arranca desde los filtros que realmente están
  // aplicados (por si se cerró sin aplicar los cambios en el intento anterior).
  useEffect(() => {
    if (abierto) setDraft(filtros);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al abrir
  }, [abierto]);

  function alternarCategoria(id: string) {
    setDraft((prev) => {
      const copia = new Set(prev.categoriaIds);
      if (copia.has(id)) copia.delete(id);
      else copia.add(id);
      return { ...prev, categoriaIds: copia };
    });
  }

  function manejarAplicar() {
    onAplicar(draft);
    onCerrar();
  }

  const claseCampoMonto =
    'h-11 w-full rounded-xl bg-black/[0.06] px-3 text-[17px] cifras placeholder-black/55 focus:outline-none dark:bg-white/10 dark:placeholder-white/50';

  return (
    <>
      <HojaInferior
        abierto={abierto}
        titulo="Filtros"
        onCerrar={onCerrar}
        pie={
          <>
            <Button large rounded onClick={manejarAplicar}>
              Aplicar filtros
            </Button>
            <Button large rounded clear onClick={() => setDraft(FILTROS_INICIALES)}>
              Limpiar filtros
            </Button>
          </>
        }
      >
        <BlockTitle className="mt-2">Tipo</BlockTitle>
        <div className="px-4">
          <SelectorVidrio>
            {TIPOS.map((t) => (
              <OpcionSelector
                key={t.valor}
                active={draft.tipo === t.valor}
                onClick={() => setDraft((prev) => ({ ...prev, tipo: t.valor }))}
              >
                {t.etiqueta}
              </OpcionSelector>
            ))}
          </SelectorVidrio>
        </div>

        {/* Solo las categorías del tipo elegido arriba; con "Todos", ambas. */}
        {draft.tipo !== 'ingreso' && gastosPorUso.length > 0 && (
          <>
            <BlockTitle>Categorías de gasto</BlockTitle>
            <SelectorCategoria
              multiple
              etiqueta="Categorías de gasto"
              categorias={gastosPorUso}
              estaElegida={(id) => draft.categoriaIds.has(id)}
              onElegir={alternarCategoria}
            />
          </>
        )}
        {draft.tipo !== 'egreso' && ingresosPorUso.length > 0 && (
          <>
            <BlockTitle>Categorías de ingreso</BlockTitle>
            <SelectorCategoria
              multiple
              etiqueta="Categorías de ingreso"
              categorias={ingresosPorUso}
              estaElegida={(id) => draft.categoriaIds.has(id)}
              onElegir={alternarCategoria}
            />
          </>
        )}

        <List strong inset className="mt-6 mb-2">
          <ListItem
            link
            linkComponent="button"
            linkProps={{ type: 'button' }}
            onClick={() => setRuedaMesAbierta(true)}
            title="Mes"
            after={draft.mes ? capitalizarPrimera(nombreMes(draft.mes)) : 'Todos'}
            contentClassName="w-full text-left"
          />
          {draft.mes && (
            <ListItem
              link
              chevron={false}
              linkComponent="button"
              linkProps={{ type: 'button' }}
              onClick={() => setDraft((prev) => ({ ...prev, mes: null }))}
              title={<span className="text-primary">Ver todos los meses</span>}
              contentClassName="w-full text-left"
            />
          )}
          <ListItem
            label
            title="Solo gastos fijos"
            after={
              <Toggle
                checked={draft.soloFijos}
                onChange={() => setDraft((prev) => ({ ...prev, soloFijos: !prev.soloFijos }))}
                aria-label="Solo gastos fijos"
              />
            }
          />
        </List>

        <BlockTitle>Monto</BlockTitle>
        <div className="flex gap-2 px-4">
          <label className="flex flex-1 flex-col gap-1">
            <span className="sr-only">Monto mínimo</span>
            <input
              className={claseCampoMonto}
              inputMode="numeric"
              enterKeyHint="next"
              placeholder="Mínimo"
              value={draft.montoMin !== null ? draft.montoMin.toLocaleString('es-CO') : ''}
              onChange={(e) => setDraft((prev) => ({ ...prev, montoMin: textoAMonto(e.target.value) }))}
            />
          </label>
          <label className="flex flex-1 flex-col gap-1">
            <span className="sr-only">Monto máximo</span>
            <input
              className={claseCampoMonto}
              inputMode="numeric"
              enterKeyHint="done"
              placeholder="Máximo"
              value={draft.montoMax !== null ? draft.montoMax.toLocaleString('es-CO') : ''}
              onChange={(e) => setDraft((prev) => ({ ...prev, montoMax: textoAMonto(e.target.value) }))}
            />
          </label>
        </div>

        <BlockTitle>Ordenar por</BlockTitle>
        <div className="px-4">
          <SelectorVidrio>
            <OpcionSelector
              active={draft.orden === 'fecha'}
              onClick={() => setDraft((prev) => ({ ...prev, orden: 'fecha' }))}
            >
              Más reciente
            </OpcionSelector>
            <OpcionSelector
              active={draft.orden === 'monto'}
              onClick={() => setDraft((prev) => ({ ...prev, orden: 'monto' }))}
            >
              Mayor monto
            </OpcionSelector>
          </SelectorVidrio>
        </div>
      </HojaInferior>

      <SelectorMesSheet
        abierto={ruedaMesAbierta}
        mes={draft.mes ?? new Date()}
        onCerrar={() => setRuedaMesAbierta(false)}
        onSeleccionar={(mes) => setDraft((prev) => ({ ...prev, mes }))}
      />
    </>
  );
}
