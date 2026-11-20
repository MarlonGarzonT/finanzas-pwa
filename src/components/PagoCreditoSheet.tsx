import { List } from 'konsta/react';
import { useState } from 'react';
import type { EstadoCredito } from '../utils/creditos';
import { fechaConHora, fechaLocalISO, formatearMonto } from '../utils/fechas';
import { BotonPrincipal } from './BotonPrincipal';
import { CampoMonto } from './CampoMonto';
import { CampoTexto } from './CampoTexto';
import { ChipOpcion } from './ChipOpcion';
import { HojaInferior } from './HojaInferior';
import { Aviso, Segmentos } from './Segmentos';

interface Props {
  abierto: boolean;
  credito: EstadoCredito | null;
  onCerrar: () => void;
  onGuardar: (monto: number, fecha: Date) => Promise<void>;
}

// Anotar que pagaste la cuota. Arranca con el valor de la cuota y con hoy: el
// caso normal es un toque. Dice, con las cifras de esa cuota, cuánto se fue en
// intereses y cuánto bajó la deuda.
export function PagoCreditoSheet({ abierto, credito, onCerrar, onGuardar }: Props) {
  const [monto, setMonto] = useState('');
  const [dia, setDia] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cada vez que la hoja se abre arranca con la cuota y con hoy.
  const [estabaAbierto, setEstabaAbierto] = useState(false);
  if (abierto !== estabaAbierto) {
    setEstabaAbierto(abierto);
    if (abierto && credito) {
      setMonto(String(Math.round(credito.cuota)));
      setDia(fechaLocalISO(new Date()));
      setGuardando(false);
      setError(null);
    }
  }

  const cuota = credito?.proximaCuota ?? null;
  const montoNum = Number(monto);
  const hoy = fechaLocalISO(new Date());
  const ayerFecha = new Date();
  ayerFecha.setDate(ayerFecha.getDate() - 1);
  const ayer = fechaLocalISO(ayerFecha);

  async function manejarGuardar() {
    if (!montoNum || montoNum <= 0) return setError('Ingresa cuánto pagaste.');
    if (!dia) return setError('Elige la fecha del pago.');
    setError(null);
    setGuardando(true);
    try {
      await onGuardar(montoNum, fechaConHora(dia, new Date()));
      onCerrar();
    } catch {
      setError('No se pudo guardar. Revisa tu conexión e intenta de nuevo.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <HojaInferior
      abierto={abierto}
      titulo={cuota ? `Cuota ${cuota.numero} de ${credito?.plazoMeses}` : 'Pago de cuota'}
      onCerrar={onCerrar}
      cierreBloqueado={guardando}
      cabecera={
        <div className="px-4 pb-3">
          <CampoMonto valor={monto} onCambiar={setMonto} etiqueta="Cuánto pagaste" autoFocus />
        </div>
      }
      pie={
        <>
          {error && (
            <p className="m-0 text-center text-[15px] text-alerta" role="alert">
              {error}
            </p>
          )}
          <BotonPrincipal texto={guardando ? 'Guardando…' : 'Guardar pago'} onClick={manejarGuardar} disabled={guardando} />
        </>
      }
    >
      <div className="my-2 flex flex-col gap-2 px-4">
        {cuota && (
          <Segmentos
            etiqueta="Así se reparte esta cuota"
            items={[
              { etiqueta: 'Intereses', valor: formatearMonto(Math.round(cuota.interes)), tono: 'intereses' },
              { etiqueta: 'Baja tu deuda', valor: formatearMonto(Math.round(cuota.capital)), tono: 'ingreso' },
            ]}
          />
        )}
        <Aviso>Cuenta como gasto del mes en que la pagaste y baja tu Disponible.</Aviso>
      </div>

      <List strong inset className="mt-3 mb-2">
        <CampoTexto etiqueta="Fecha del pago" type="date" valor={dia} onCambiar={setDia} />
      </List>
      <div className="flex gap-2 px-4">
        <ChipOpcion activo={dia === hoy} onClick={() => setDia(hoy)}>
          Hoy
        </ChipOpcion>
        <ChipOpcion activo={dia === ayer} onClick={() => setDia(ayer)}>
          Ayer
        </ChipOpcion>
      </div>
    </HojaInferior>
  );
}
