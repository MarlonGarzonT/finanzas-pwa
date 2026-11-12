// Reemplaza al Service Worker de la app vieja en GitHub Pages
// (marlongarzont.github.io/finanzas-pwa). Mi Cuadre ahora vive en
// micuadre-app.vercel.app y este link solo publica la página de mudanza.
//
// Sin esto, quien ya había abierto la app seguiría viendo la copia guardada
// por el Service Worker viejo y nunca llegaría a la página de mudanza. La app
// vieja busca un sw.js nuevo cada vez que vuelve al frente: este se activa
// de una vez (sin esperar el botón "Actualizar"), toma las ventanas abiertas
// (la app vieja recarga sola al cambiar de Service Worker), borra la copia
// guardada y se da de baja. Al recargar, la página llega de la red.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    (async () => {
      await self.clients.claim();
      const claves = await caches.keys();
      await Promise.all(claves.map((clave) => caches.delete(clave)));
      await self.registration.unregister();
      // Por si alguna ventana no recarga sola (versiones muy viejas).
      const ventanas = await self.clients.matchAll({ type: 'window' });
      await Promise.all(ventanas.map((ventana) => ventana.navigate(ventana.url).catch(() => {})));
    })()
  );
});
