import { BlockFooter, Button, List } from 'konsta/react';
import { useState } from 'react';
import type { Credito, NuevoCredito } from '../types';
import { fechaDeCuota, fechaPrimeraCuotaDesdeProxima } from '../utils/creditos';
import { CampoTexto } from './CampoTexto';
import { HojaInferior } from './HojaInferior';

interface Props {
  abierto: boolean;
  credito: Credito | null;
  // Cuotas pagadas hasta hoy: de ahí sale cuál es "la próxima cuota".
  cuotasPagadas: number;
  onCerrar: () => void;
  onGuardar: (cambios: Pick<NuevoCredito, 'nombre' | 'entidad' | 'fechaPrimeraCuota'>) => Promise<void>;
}

// Corregir el nombre, el banco o el día en que vence la cuota. Las cifras del
// contrato (valor, cuota, plazo) no se tocan: cambiarían los intereses de todas
// las cuotas ya pagadas.
export function EditarCreditoSheet({ abierto, credito, cuotasPagadas, onCerrar, onGuardar }: Props) {
  const [nombre, setNombre] = useState('');
  const [entidad, setEntidad] = useState('');
  const [proxima, setProxima] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [estabaAbierto, setEstabaAbierto] = useState(false);
  if (abierto !== estabaAbierto) {
    setEstabaAbierto(abierto);
    if (abierto && credito) {
      setNombre(credito.nombre);
      setEntidad(credito.entidad ?? '');
      setProxima(fechaDeCuota(credito.fechaPrimeraCuota, Math.min(cuotasPagadas + 1, credito.plazoMeses)));
      setGuardando(false);
      setError(null);
    }
  }

  async function manejarGuardar() {
    if (!credito) return;
    if (!nombre.trim()) return setError('Ponle un nombre al crédito.');
    if (!proxima) return setError('Elige la fecha de la próxima cuota.');
    setError(null);
    setGuardando(true);
    try {
      await onGuardar({
        nombre: nombre.trim(),
        entidad: entidad.trim() || null,
        fechaPrimeraCuota: fechaPrimeraCuotaDesdeProxima(proxima, Math.min(cuotasPagadas, credito.plazoMeses - 1)),
      });
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
      titulo="Editar crédito"
      onCerrar={onCerrar}
      cierreBloqueado={guardando}
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
        </>
      }
    >
      <List strong inset className="mt-2">
        <CampoTexto etiqueta="Nombre" valor={nombre} onCambiar={setNombre} placeholder="Moto, carro, vivienda…" enterKeyHint="next" />
        <CampoTexto etiqueta="Banco o entidad" valor={entidad} onCambiar={setEntidad} placeholder="Opcional" autoCapitalize="words" />
        <CampoTexto etiqueta="Fecha de la próxima cuota" type="date" valor={proxima} onCambiar={setProxima} />
      </List>
      <BlockFooter>
        El valor, la cuota y el plazo no se pueden cambiar. Si te equivocaste en alguno, elimina el crédito y regístralo de nuevo.
      </BlockFooter>
    </HojaInferior>
  );
}
