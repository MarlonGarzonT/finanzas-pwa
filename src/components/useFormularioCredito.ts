import { useState } from 'react';
import type { NuevoCredito } from '../types';
import { fechaLocalISO } from '../utils/fechas';
import { fechaPrimeraCuotaDesdeProxima, tasaEfectivaAnual, tasaMensualDeCredito } from '../utils/creditos';

export const PASOS_CREDITO = ['Crédito', 'Cifras', 'Avance'] as const;
const ULTIMO_PASO = PASOS_CREDITO.length - 1;
const PLAZO_MAXIMO_MESES = 600;

interface Argumentos {
  abierto: boolean;
  onGuardar: (datos: NuevoCredito) => Promise<void>;
  onCerrar: () => void;
}

// Mismo día del mes que hoy, el mes que viene: punto de partida razonable para
// "¿cuándo vence tu próxima cuota?" que la persona corrige si no es.
function proximoMes(): string {
  const hoy = new Date();
  const destino = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1);
  const ultimoDia = new Date(destino.getFullYear(), destino.getMonth() + 1, 0).getDate();
  destino.setDate(Math.min(hoy.getDate(), ultimoDia));
  return fechaLocalISO(destino);
}

// Estado y reglas del formulario de un crédito nuevo, por pasos como el resto
// de la app: qué crédito es → las cifras del contrato → en qué cuota va.
export function useFormularioCredito({ abierto, onGuardar, onCerrar }: Argumentos) {
  const [nombre, setNombre] = useState('');
  const [entidad, setEntidad] = useState('');
  const [monto, setMonto] = useState('');
  const [cuota, setCuota] = useState('');
  const [plazo, setPlazo] = useState('');
  const [pagadas, setPagadas] = useState('0');
  const [proxima, setProxima] = useState('');
  const [paso, setPaso] = useState(0);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cada vez que la hoja se abre arranca limpia.
  const [estabaAbierto, setEstabaAbierto] = useState(false);
  if (abierto !== estabaAbierto) {
    setEstabaAbierto(abierto);
    if (abierto) {
      setNombre('');
      setEntidad('');
      setMonto('');
      setCuota('');
      setPlazo('');
      setPagadas('0');
      setProxima(proximoMes());
      setPaso(0);
      setGuardando(false);
      setError(null);
    }
  }

  const montoNum = Number(monto);
  const cuotaNum = Number(cuota);
  const plazoNum = Number(plazo);
  const pagadasNum = Number(pagadas);

  const cifrasCompletas = montoNum > 0 && cuotaNum > 0 && plazoNum >= 1 && plazoNum <= PLAZO_MAXIMO_MESES;
  // Si las cuotas no alcanzan a devolver lo prestado, los números no cuadran:
  // casi siempre es un dato mal escrito (un cero de menos).
  const cuotasNoAlcanzan = cifrasCompletas && cuotaNum * plazoNum < montoNum;
  const cifrasValidas = cifrasCompletas && !cuotasNoAlcanzan;

  // Lo que se le muestra mientras escribe: el costo del crédito con sus datos.
  const calculo = cifrasValidas
    ? (() => {
        const tasaMensual = tasaMensualDeCredito({ montoFinanciado: montoNum, cuota: cuotaNum, plazoMeses: plazoNum });
        return {
          totalAPagar: cuotaNum * plazoNum,
          intereses: cuotaNum * plazoNum - montoNum,
          tasaMensual,
          tasaEfectivaAnual: tasaEfectivaAnual(tasaMensual),
        };
      })()
    : null;

  const pagadasValidas = Number.isInteger(pagadasNum) && pagadasNum >= 0 && pagadasNum < plazoNum;
  const puedeContinuar = paso === 0 ? nombre.trim().length > 0 : paso === 1 ? cifrasValidas : pagadasValidas && Boolean(proxima);

  function irAlPaso(destino: number) {
    setError(null);
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    setPaso(Math.max(0, Math.min(destino, ULTIMO_PASO)));
  }

  async function guardar() {
    if (!nombre.trim()) {
      setPaso(0);
      return setError('Ponle un nombre al crédito.');
    }
    if (!cifrasValidas) {
      setPaso(1);
      return setError(cuotasNoAlcanzan ? 'Las cuotas suman menos de lo que te prestaron. Revisa los datos.' : 'Completa el valor, la cuota y el plazo.');
    }
    if (!pagadasValidas || !proxima) return setError('Revisa cuántas cuotas llevas pagadas y la fecha de la próxima.');
    setError(null);
    setGuardando(true);
    try {
      await onGuardar({
        nombre: nombre.trim(),
        entidad: entidad.trim() || null,
        montoFinanciado: montoNum,
        cuota: cuotaNum,
        plazoMeses: plazoNum,
        cuotasPagadasInicial: pagadasNum,
        fechaPrimeraCuota: fechaPrimeraCuotaDesdeProxima(proxima, pagadasNum),
      });
      onCerrar();
    } catch {
      setError('No se pudo guardar. Revisa tu conexión e intenta de nuevo.');
    } finally {
      setGuardando(false);
    }
  }

  return {
    nombre,
    entidad,
    monto,
    cuota,
    plazo,
    pagadas,
    proxima,
    paso,
    guardando,
    error,
    calculo,
    cuotasNoAlcanzan,
    pagadasValidas,
    puedeContinuar,
    plazoNum,
    pagadasNum,
    setNombre,
    setEntidad,
    setMonto,
    setCuota,
    setPlazo,
    setPagadas,
    setProxima,
    irAlPaso,
    guardar,
  };
}
