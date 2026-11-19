import { Button, List } from 'konsta/react';
import { useEffect, type ReactNode } from 'react';
import { useFinanzas } from '../data/FinanzasContext';
import type { NuevoPrestamo } from '../types';
import { fechaLocalISO, formatearMonto } from '../utils/fechas';
import { fechaDePlazo, PLAZOS_RAPIDOS, personasFrecuentes } from '../utils/prestamos';
import { AvatarPersona } from './AvatarPersona';
import { CampoMonto } from './CampoMonto';
import { CampoTexto } from './CampoTexto';
import { ChipOpcion } from './ChipOpcion';
import { HojaInferior } from './HojaInferior';
import { PasosDeslizantes, ProgresoPasos } from './PasosDeslizantes';
import { PASOS_PRESTAMO, useFormularioPrestamo } from './useFormularioPrestamo';

interface Props {
  abierto: boolean;
  onCerrar: () => void;
  onGuardar: (datos: NuevoPrestamo) => Promise<void>;
}

function Encabezado({ children, ayuda }: { children: ReactNode; ayuda?: string }) {
  return (
    <div className="px-4 pb-3">
      <h3 className="m-0 text-[22px] leading-tight font-bold tracking-tight">{children}</h3>
      {ayuda && <p className="m-0 mt-1 text-[15px] leading-snug text-secundario">{ayuda}</p>}
    </div>
  );
}

// Registrar un préstamo en tres pasos con la misma transición push de iOS que
// un movimiento nuevo: a quién → cuánto → cuándo te paga. Cada pregunta es una
// sola cosa, en el orden en que se piensa ("le presté a Juan 200 mil, me paga
// en quincena").
export function NuevoPrestamoSheet({ abierto, onCerrar, onGuardar }: Props) {
  const { prestamos } = useFinanzas();
  const f = useFormularioPrestamo({ abierto, onGuardar, onCerrar });
  const frecuentes = personasFrecuentes(prestamos);
  const ultimoPaso = f.paso === PASOS_PRESTAMO.length - 1;
  const hoy = fechaLocalISO(new Date());

  // El monto toma el teclado al llegar a su paso (el primer campo ya lo toma
  // con autoFocus al abrir la hoja).
  useEffect(() => {
    if (!abierto || f.paso !== 1) return;
    document
      .querySelector<HTMLInputElement>('.paso-deslizante[data-estado="actual"] input[inputmode="numeric"]')
      ?.focus({ preventScroll: true });
  }, [abierto, f.paso]);

  function continuar() {
    if (f.puedeContinuar) f.irAlPaso(f.paso + 1);
  }

  const pasos = [
    {
      clave: 'persona',
      titulo: 'Persona',
      contenido: (
        <div className="pb-2">
          <Encabezado>¿A quién le prestas?</Encabezado>
          <List strong inset className="mt-0 mb-3">
            <CampoTexto
              etiqueta="Nombre"
              valor={f.persona}
              onCambiar={f.setPersona}
              placeholder="Juan, mi hermana, Laura…"
              autoCapitalize="words"
              enterKeyHint="next"
              onEnter={continuar}
              autoFocus
            />
          </List>
          {frecuentes.length > 0 && (
            <div className="px-4">
              <p className="m-0 mb-2 text-[13px] font-medium text-secundario">Ya les has prestado</p>
              <div className="flex flex-wrap gap-2">
                {frecuentes.map((nombre) => (
                  <ChipOpcion
                    key={nombre}
                    activo={f.persona.trim().toLowerCase() === nombre.toLowerCase()}
                    onClick={() => {
                      f.setPersona(nombre);
                      f.irAlPaso(1);
                    }}
                  >
                    {nombre}
                  </ChipOpcion>
                ))}
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      clave: 'monto',
      titulo: 'Monto',
      contenido: (
        <div className="pb-2">
          <Encabezado>{`¿Cuánto le prestas${f.persona.trim() ? ` a ${f.persona.trim().split(' ')[0]}` : ''}?`}</Encabezado>
          <div className="px-4 pt-3">
            <CampoMonto
              valor={f.monto}
              onCambiar={f.setMonto}
              etiqueta="Cuánto prestas"
              enterKeyHint="next"
              onEnter={continuar}
            />
          </div>
          <p className="m-0 mt-4 px-8 text-center text-[14px] leading-snug text-balance text-secundario">
            Sale de tu Disponible de este mes y vuelve con cada pago que te hagan. No cuenta como gasto.
          </p>
        </div>
      ),
    },
    {
      clave: 'plazo',
      titulo: 'Plazo',
      contenido: (
        <div className="pb-2">
          <Encabezado>¿Cuándo te paga?</Encabezado>
          <div className="mx-4 flex items-stretch rounded-2xl bg-black/[0.04] dark:bg-white/[0.07]">
            <button
              type="button"
              onClick={() => f.irAlPaso(0)}
              aria-label={`Persona ${f.persona}. Cambiar`}
              className="flex min-h-14 min-w-0 flex-1 items-center gap-3 rounded-l-2xl px-3 text-left active:opacity-60"
            >
              <AvatarPersona persona={f.persona || '?'} id={f.persona || 'nuevo'} />
              <span className="min-w-0">
                <span className="block truncate text-[17px] font-semibold">{f.persona.trim()}</span>
                <span className="block text-[13px] text-secundario">Cambiar</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => f.irAlPaso(1)}
              aria-label={`Monto ${formatearMonto(Number(f.monto))}. Cambiar`}
              className="flex min-h-14 shrink-0 items-center rounded-r-2xl px-4 text-[19px] font-bold cifras active:opacity-60"
            >
              {formatearMonto(Number(f.monto))}
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 px-4">
            {PLAZOS_RAPIDOS.map(({ clave, etiqueta }) => (
              <ChipOpcion key={clave} activo={f.fechaDevolucion === fechaDePlazo(clave)} onClick={() => f.setFechaDevolucion(fechaDePlazo(clave))}>
                {etiqueta}
              </ChipOpcion>
            ))}
          </div>

          <List strong inset className="mt-4 mb-2">
            <CampoTexto etiqueta="Quedó de pagarte el" type="date" valor={f.fechaDevolucion} onCambiar={f.setFechaDevolucion} min={hoy} />
            <CampoTexto etiqueta="Nota" valor={f.nota} onCambiar={f.setNota} placeholder="Opcional: para qué fue" enterKeyHint="go" onEnter={f.guardar} />
          </List>
        </div>
      ),
    },
  ];

  return (
    <HojaInferior
      abierto={abierto}
      titulo="Nuevo préstamo"
      onCerrar={onCerrar}
      cierreBloqueado={f.guardando}
      onAtras={f.paso > 0 ? () => f.irAlPaso(f.paso - 1) : undefined}
      reiniciarScroll={f.paso}
      cabecera={<ProgresoPasos paso={f.paso} etiquetas={PASOS_PRESTAMO} descripcion="Progreso del préstamo" />}
      pie={
        <>
          {f.error && (
            <p className="m-0 text-center text-[15px] text-alerta" role="alert">
              {f.error}
            </p>
          )}
          <Button
            large
            rounded
            onClick={ultimoPaso ? f.guardar : continuar}
            disabled={f.guardando || (!ultimoPaso && !f.puedeContinuar)}
          >
            {f.guardando ? 'Guardando…' : ultimoPaso ? 'Registrar préstamo' : 'Continuar'}
          </Button>
        </>
      }
    >
      <PasosDeslizantes paso={f.paso} pasos={pasos} />
    </HojaInferior>
  );
}
