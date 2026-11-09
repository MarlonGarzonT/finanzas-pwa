import { BlockTitle, Button, List, ListItem, Toggle } from 'konsta/react';
import { useEffect, useState } from 'react';
import type { Categoria, GastoAnual, NuevoGastoAnual } from '../types';
import { capitalizarPrimera, nombreMesDelAnio } from '../utils/fechas';
import { CampoMonto } from './CampoMonto';
import { CampoTexto } from './CampoTexto';
import { ChipOpcion } from './ChipOpcion';
import { DialogoConfirmar } from './DialogoConfirmar';
import { HojaInferior } from './HojaInferior';
import { SelectorCategoria } from './SelectorCategoria';

interface Props {
  abierto: boolean;
  // null: se está creando uno nuevo.
  gasto: GastoAnual | null;
  // Nombre que llega de una sugerencia ("SOAT"); el monto nunca se prellena.
  nombreInicial?: string;
  categoriasDeGasto: Categoria[];
  onCerrar: () => void;
  onGuardar: (datos: NuevoGastoAnual) => Promise<void>;
  onEliminar?: () => Promise<void>;
}

const MESES = Array.from({ length: 12 }, (_, i) => {
  const largo = nombreMesDelAnio(i + 1);
  return { numero: i + 1, largo, corto: capitalizarPrimera(largo.slice(0, 3)) };
});

export function EditarGastoAnualSheet({
  abierto,
  gasto,
  nombreInicial = '',
  categoriasDeGasto,
  onCerrar,
  onGuardar,
  onEliminar,
}: Props) {
  const [nombre, setNombre] = useState('');
  const [monto, setMonto] = useState('');
  const [mes, setMes] = useState<number | null>(null);
  const [categoriaId, setCategoriaId] = useState<string | null>(null);
  const [activo, setActivo] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!abierto) return;
    setNombre(gasto?.nombre ?? nombreInicial);
    setMonto(gasto ? String(Math.round(gasto.montoEstimado)) : '');
    setMes(gasto?.mesVencimiento ?? null);
    setCategoriaId(gasto?.categoriaId ?? null);
    setActivo(gasto?.activo ?? true);
    setGuardando(false);
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al abrir o cambiar de gasto
  }, [abierto, gasto?.id]);

  async function manejarGuardar() {
    const limpio = nombre.trim();
    const montoNum = Number(monto);
    if (!limpio) return setError('Escribe qué gasto es.');
    if (!montoNum || montoNum <= 0) return setError('Ingresa cuánto calculas que te va a costar.');
    if (mes === null) return setError('Elige el mes en que vence.');
    setError(null);
    setGuardando(true);
    try {
      await onGuardar({ nombre: limpio, montoEstimado: montoNum, mesVencimiento: mes, categoriaId, activo });
      onCerrar();
    } catch {
      setError('No se pudo guardar. Revisa tu conexión e intenta de nuevo.');
    } finally {
      setGuardando(false);
    }
  }

  async function manejarEliminar() {
    if (!onEliminar) return;
    setConfirmandoEliminar(false);
    setGuardando(true);
    try {
      await onEliminar();
      onCerrar();
    } catch {
      setError('No se pudo eliminar. Intenta de nuevo.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <>
      <HojaInferior
        abierto={abierto}
        titulo={gasto ? 'Editar gasto del año' : 'Nuevo gasto del año'}
        onCerrar={onCerrar}
        cierreBloqueado={guardando}
        cabecera={
          <div className="px-4 pb-3">
            <CampoMonto valor={monto} onCambiar={setMonto} etiqueta="Monto estimado" autoFocus={!gasto && Boolean(nombreInicial)} />
          </div>
        }
        pie={
          <>
            {error && (
              <p className="m-0 text-center text-[15px] text-alerta" role="alert">
                {error}
              </p>
            )}
            <Button large rounded onClick={manejarGuardar} disabled={guardando}>
              {guardando ? 'Guardando…' : 'Guardar'}
            </Button>
            {gasto && onEliminar && (
              <Button large rounded clear className="text-alerta" onClick={() => setConfirmandoEliminar(true)} disabled={guardando}>
                Eliminar gasto
              </Button>
            )}
          </>
        }
      >
        <List strong inset className="mt-2 mb-2">
          <CampoTexto etiqueta="Nombre" valor={nombre} onCambiar={setNombre} placeholder="SOAT, predial, matrícula…" />
        </List>

        <BlockTitle>Mes en que vence</BlockTitle>
        <div className="flex flex-wrap gap-2 px-4" role="group" aria-label="Mes en que vence">
          {MESES.map((m) => (
            <ChipOpcion key={m.numero} activo={mes === m.numero} onClick={() => setMes(m.numero)}>
              <span aria-hidden="true">{m.corto}</span>
              <span className="sr-only">{m.largo}</span>
            </ChipOpcion>
          ))}
        </div>

        <BlockTitle>Categoría con la que lo pagas</BlockTitle>
        <SelectorCategoria
          categorias={categoriasDeGasto}
          estaElegida={(id) => id === categoriaId}
          onElegir={(id) => setCategoriaId((actual) => (actual === id ? null : id))}
          etiqueta="Categoría con la que lo pagas"
        />
        {/* Párrafo y no BlockFooter: el de Konsta sube con margen negativo
            para pegarse a una List y aquí pisaría la cuadrícula. */}
        <p className="m-0 px-4 pt-3 text-[13px] leading-snug text-secundario">
          Opcional. Así la app reconoce el pago y no lo cuenta como más gasto frente al mes anterior. Toca otra vez para
          quitarla.
        </p>

        {gasto && (
          <List strong inset className="my-2">
            <ListItem
              label
              title="Tenerlo en cuenta"
              text="Si lo apagas, no suma en lo que te cuestan al mes"
              after={<Toggle checked={activo} onChange={() => setActivo((v) => !v)} aria-label="Tenerlo en cuenta" />}
            />
          </List>
        )}
      </HojaInferior>

      <DialogoConfirmar
        abierto={confirmandoEliminar}
        titulo={`¿Eliminar ${gasto?.nombre ?? 'este gasto'}?`}
        mensaje="Dejará de sumar en lo que te cuestan al mes. Tus movimientos no cambian."
        textoConfirmar="Eliminar"
        onConfirmar={manejarEliminar}
        onCancelar={() => setConfirmandoEliminar(false)}
      />
    </>
  );
}
