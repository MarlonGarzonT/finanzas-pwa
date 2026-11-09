import { useEffect, useRef, useState } from 'react';
import { activarPush, consultarPush, desactivarPush, type EstadoPush } from './notificacionesPush';

export interface NotificacionesPush {
  estado: EstadoPush;
  ocupado: boolean;
  error: string | null;
  alternar: () => void;
}

export function useNotificacionesPush(): NotificacionesPush {
  const [estado, setEstado] = useState<EstadoPush>('cargando');
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Se guarda al consultar para que activar no tenga que esperar nada antes
  // de pedir el permiso (Safari lo exige dentro del toque).
  const registroRef = useRef<ServiceWorkerRegistration | undefined>(undefined);

  useEffect(() => {
    let vigente = true;
    const consultar = () =>
      consultarPush()
        .then(({ estado: actual, registro }) => {
          if (!vigente) return;
          registroRef.current = registro;
          setEstado(actual);
        })
        .catch(() => vigente && setEstado('no-soportado'));
    consultar();
    // En la primera visita el service worker termina de instalarse después
    // de la consulta: cuando quede listo se vuelve a consultar, sin recargar.
    if ('serviceWorker' in navigator) navigator.serviceWorker.ready.then(consultar);
    return () => {
      vigente = false;
    };
  }, []);

  function alternar() {
    const registro = registroRef.current;
    if (!registro || ocupado) return;
    const encender = estado !== 'encendido';
    setOcupado(true);
    setError(null);
    const accion = encender ? activarPush(registro) : desactivarPush(registro).then((): EstadoPush => 'apagado');
    accion
      .then(setEstado)
      .catch(() =>
        setError(
          encender
            ? 'No se pudieron activar los avisos. Revisa tu conexión e intenta de nuevo.'
            : 'No se pudieron apagar los avisos. Revisa tu conexión e intenta de nuevo.'
        )
      )
      .finally(() => setOcupado(false));
  }

  return { estado, ocupado, error, alternar };
}
