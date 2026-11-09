import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

const UNA_HORA_MS = 60 * 60 * 1000;
// Si la recarga no llega (Service Worker trabado, Safari raro), se fuerza:
// nunca se deja el botón girando para siempre.
const TIEMPO_MAXIMO_ACTUALIZAR_MS = 5000;

export interface ActualizacionApp {
  hayVersionNueva: boolean;
  actualizando: boolean;
  actualizar: () => void;
  descartar: () => void;
}

// Registra el Service Worker y avisa cuando hay una versión nueva esperando.
// Instalada en el iPhone, la PWA casi nunca se "abre de cero": iOS la deja
// suspendida y al volver no hay navegación, así que el navegador no busca un
// sw.js nuevo por su cuenta. Por eso se le pide que lo busque cada vez que la
// app vuelve al frente y, por si queda abierta mucho rato, cada hora.
export function useActualizacionApp(): ActualizacionApp {
  const [descartada, setDescartada] = useState(false);
  const [actualizando, setActualizando] = useState(false);

  const {
    needRefresh: [hayVersionNueva],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registro) {
      if (!registro) return;
      const buscar = () => {
        if (registro.installing || !navigator.onLine) return;
        registro.update().catch(() => {
          // Sin conexión o GitHub Pages caído: se reintenta en la próxima vuelta.
        });
      };
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') buscar();
      });
      window.setInterval(buscar, UNA_HORA_MS);
    },
  });

  // "Ahora no" esconde el aviso solo hasta que la persona vuelva a la app.
  useEffect(() => {
    function alVolver() {
      if (document.visibilityState === 'visible') setDescartada(false);
    }
    document.addEventListener('visibilitychange', alVolver);
    return () => document.removeEventListener('visibilitychange', alVolver);
  }, []);

  function actualizar() {
    setActualizando(true);
    updateServiceWorker(true).catch(() => window.location.reload());
    window.setTimeout(() => window.location.reload(), TIEMPO_MAXIMO_ACTUALIZAR_MS);
  }

  return {
    hayVersionNueva: hayVersionNueva && !descartada,
    actualizando,
    actualizar,
    descartar: () => setDescartada(true),
  };
}
