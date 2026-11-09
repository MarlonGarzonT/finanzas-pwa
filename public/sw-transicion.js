// Puente para las ventanas que todavía corren una versión vieja de la app (la
// de antes del aviso "Nueva versión", con el Service Worker en autoUpdate).
// En modo prompt el SW nuevo espera a que alguien toque "Actualizar", pero
// esas ventanas no tienen el botón y se quedarían en la versión vieja hasta
// cerrar la app del todo. Al instalarse, el SW pregunta a cada ventana si
// sabe mostrar el aviso (ver main.tsx); si alguna no contesta, es vieja: el SW
// se activa solo y la ventana vieja recarga (su main.tsx recarga en
// controllerchange). Las ventanas nuevas contestan y siguen con el aviso.
const PREGUNTA = 'FINANZAS_SOPORTA_AVISO';
const ESPERA_RESPUESTA_MS = 1500;

function preguntar(cliente) {
  return new Promise((resolver) => {
    const canal = new MessageChannel();
    const limite = setTimeout(() => resolver(false), ESPERA_RESPUESTA_MS);
    canal.port1.onmessage = () => {
      clearTimeout(limite);
      resolver(true);
    };
    cliente.postMessage({ tipo: PREGUNTA }, [canal.port2]);
  });
}

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    (async () => {
      // includeUncontrolled: mientras se instala, este SW todavía no controla
      // ninguna ventana (las controla el SW anterior); sin esto no ve ninguna.
      const clientes = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      if (clientes.length === 0) return;
      const respuestas = await Promise.all(clientes.map(preguntar));
      if (respuestas.some((soporta) => !soporta)) await self.skipWaiting();
    })()
  );
});
