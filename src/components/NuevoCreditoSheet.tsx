import { List } from 'konsta/react';
import { useEffect, type ReactNode } from 'react';
import type { NuevoCredito } from '../types';
import { fechaDeCuota, fechaPrimeraCuotaDesdeProxima, formatearDiaConAnio, NOMBRES_SUGERIDOS_CREDITO } from '../utils/creditos';
import { formatearMonto } from '../utils/fechas';
import { BotonPrincipal } from './BotonPrincipal';
import { CampoTexto } from './CampoTexto';
import { ChipOpcion } from './ChipOpcion';
import { HojaInferior } from './HojaInferior';
import { PasosDeslizantes, ProgresoPasos } from './PasosDeslizantes';
import { PASOS_CREDITO, useFormularioCredito } from './useFormularioCredito';

interface Props {
  abierto: boolean;
  onCerrar: () => void;
  onGuardar: (datos: NuevoCredito) => Promise<void>;
}

function Encabezado({ children, ayuda }: { children: ReactNode; ayuda?: string }) {
  return (
    <div className="px-4 pb-3">
      <h3 className="m-0 text-[22px] leading-tight font-bold tracking-tight">{children}</h3>
      {ayuda && <p className="m-0 mt-1 text-[15px] leading-snug text-secundario">{ayuda}</p>}
    </div>
  );
}

function porcentaje(valor: number, decimales = 2): string {
  return `${valor.toLocaleString('es-CO', { minimumFractionDigits: decimales, maximumFractionDigits: decimales })} %`;
}

// Registrar un crédito en tres pasos con la misma transición push que un
// movimiento nuevo: qué crédito es → las cifras de su contrato (con el costo
// calculado en vivo) → en qué cuota va.
export function NuevoCreditoSheet({ abierto, onCerrar, onGuardar }: Props) {
  const f = useFormularioCredito({ abierto, onGuardar, onCerrar });
  const ultimoPaso = f.paso === PASOS_CREDITO.length - 1;

  // El primer campo de cada paso toma el teclado al llegar (el del paso 1 ya
  // lo toma con autoFocus al abrir la hoja).
  useEffect(() => {
    if (!abierto || f.paso !== 1) return;
    document
      .querySelector<HTMLInputElement>('.paso-deslizante[data-estado="actual"] input[inputmode="numeric"]')
      ?.focus({ preventScroll: true });
  }, [abierto, f.paso]);

  function continuar() {
    if (f.puedeContinuar) f.irAlPaso(f.paso + 1);
  }

  const primeraCuota = f.proxima && f.pagadasValidas ? fechaPrimeraCuotaDesdeProxima(f.proxima, f.pagadasNum) : null;
  const fechaFinal = primeraCuota && f.plazoNum > 0 ? fechaDeCuota(primeraCuota, f.plazoNum) : null;

  const pasos = [
    {
      clave: 'credito',
      titulo: 'Crédito',
      contenido: (
        <div className="pb-2">
          <Encabezado>¿Qué crédito pagas?</Encabezado>
          <List strong inset className="mt-0 mb-3">
            <CampoTexto
              etiqueta="Nombre"
              valor={f.nombre}
              onCambiar={f.setNombre}
              placeholder="Moto, carro, vivienda…"
              autoCapitalize="sentences"
              enterKeyHint="next"
              onEnter={continuar}
              autoFocus
            />
            <CampoTexto etiqueta="Banco o entidad" valor={f.entidad} onCambiar={f.setEntidad} placeholder="Opcional" autoCapitalize="words" />
          </List>
          <div className="flex flex-wrap gap-2 px-4">
            {NOMBRES_SUGERIDOS_CREDITO.map((nombre) => (
              <ChipOpcion
                key={nombre}
                activo={f.nombre.trim().toLowerCase() === nombre.toLowerCase()}
                onClick={() => {
                  f.setNombre(nombre);
                  f.irAlPaso(1);
                }}
              >
                {nombre}
              </ChipOpcion>
            ))}
          </div>
        </div>
      ),
    },
    {
      clave: 'cifras',
      titulo: 'Cifras',
      contenido: (
        <div className="pb-2">
          <Encabezado ayuda="Las encuentras en el contrato o en tu extracto del banco.">Las cifras de tu crédito</Encabezado>
          <List strong inset className="mt-0 mb-3">
            <CampoTexto
              etiqueta="Valor del crédito (lo que te prestaron)"
              valor={f.monto}
              onCambiar={f.setMonto}
              numerico="monto"
              placeholder="12.000.000"
              enterKeyHint="next"
            />
            <CampoTexto etiqueta="Cuota mensual" valor={f.cuota} onCambiar={f.setCuota} numerico="monto" placeholder="700.000" enterKeyHint="next" />
            <CampoTexto
              etiqueta="Número de cuotas (plazo en meses)"
              valor={f.plazo}
              onCambiar={f.setPlazo}
              numerico="entero"
              placeholder="24"
              enterKeyHint="done"
              onEnter={continuar}
            />
          </List>

          {f.cuotasNoAlcanzan && (
            <p className="m-0 px-6 text-[14px] leading-snug text-alerta" role="alert">
              Las cuotas suman menos de lo que te prestaron. Revisa que los montos estén completos.
            </p>
          )}
          {f.calculo && (
            <div className="mx-4 rounded-2xl bg-primary/10 px-4 py-3.5" aria-live="polite">
              <p className="m-0 text-[15px] leading-snug">
                Pagarás en total <span className="font-semibold cifras">{formatearMonto(f.calculo.totalAPagar)}</span>. De eso,{' '}
                <span className="font-semibold cifras">{formatearMonto(Math.round(f.calculo.intereses))}</span> son intereses.
              </p>
              <p className="m-0 mt-1.5 text-[13px] text-secundario cifras">
                Tasa aproximada: {porcentaje(f.calculo.tasaMensual * 100)} mensual · {porcentaje(f.calculo.tasaEfectivaAnual, 1)} efectivo anual
              </p>
            </div>
          )}
        </div>
      ),
    },
    {
      clave: 'avance',
      titulo: 'Avance',
      contenido: (
        <div className="pb-2">
          <Encabezado ayuda="Así sabemos en qué cuota estás y cuántas te faltan.">¿En qué cuota vas?</Encabezado>
          <List strong inset className="mt-0 mb-3">
            <CampoTexto
              etiqueta="Cuotas que ya pagaste"
              valor={f.pagadas}
              onCambiar={f.setPagadas}
              numerico="entero"
              placeholder="0"
              enterKeyHint="next"
            />
            <CampoTexto etiqueta="Fecha de tu próxima cuota" type="date" valor={f.proxima} onCambiar={f.setProxima} />
          </List>
          {f.pagadasValidas ? (
            <p className="m-0 px-6 text-[14px] leading-snug text-secundario">
              Vas por la cuota <span className="font-semibold cifras">{f.pagadasNum + 1}</span> de{' '}
              <span className="cifras">{f.plazoNum}</span>
              {fechaFinal ? `, y terminas de pagar el ${formatearDiaConAnio(fechaFinal)}` : ''}. Cada mes la cuota vence el mismo día.
            </p>
          ) : (
            <p className="m-0 px-6 text-[14px] leading-snug text-alerta" role="alert">
              Las cuotas pagadas deben ser menos que el total ({f.plazoNum || '—'}).
            </p>
          )}
        </div>
      ),
    },
  ];

  return (
    <HojaInferior
      abierto={abierto}
      titulo="Nuevo crédito"
      onCerrar={onCerrar}
      cierreBloqueado={f.guardando}
      onAtras={f.paso > 0 ? () => f.irAlPaso(f.paso - 1) : undefined}
      reiniciarScroll={f.paso}
      cabecera={<ProgresoPasos paso={f.paso} etiquetas={PASOS_CREDITO} descripcion="Progreso del crédito" />}
      pie={
        <>
          {f.error && (
            <p className="m-0 text-center text-[15px] text-alerta" role="alert">
              {f.error}
            </p>
          )}
          <BotonPrincipal
            texto={f.guardando ? 'Guardando…' : ultimoPaso ? 'Registrar crédito' : 'Continuar'}
            onClick={ultimoPaso ? f.guardar : continuar}
            disabled={f.guardando || !f.puedeContinuar}
          />
        </>
      }
    >
      <PasosDeslizantes paso={f.paso} pasos={pasos} />
    </HojaInferior>
  );
}
