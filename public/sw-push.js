// Notificaciones push (avisos de préstamos vencidos). Lo importa el service
// worker que genera Workbox (vite.config.ts, workbox.importScripts). El
// mensaje lo arma la Edge Function avisar-prestamos-vencidos:
// { titulo, cuerpo, ruta, etiqueta }.

self.addEventListener('push', (evento) => {
  let datos = {};
  try {
    datos = evento.data ? evento.data.json() : {};
  } catch {
    datos = { cuerpo: evento.data ? evento.data.text() : '' };
  }
  evento.waitUntil(
    self.registration.showNotification(datos.titulo || 'Mis Finanzas', {
      body: datos.cuerpo || '',
      icon: 'icons/icon-192.png',
      // La misma etiqueta reemplaza el aviso anterior en vez de apilarlos.
      tag: datos.etiqueta || 'prestamos',
      data: { ruta: datos.ruta || '/prestamos' },
    })
  );
});

// Al tocar el aviso se abre la app en la sección del aviso. Si ya está
// abierta, se usa esa ventana en vez de abrir otra.
self.addEventListener('notificationclick', (evento) => {
  evento.notification.close();
  const ruta = (evento.notification.data && evento.notification.data.ruta) || '/';
  const destino = new URL('#' + ruta, self.registration.scope).href;
  evento.waitUntil(
    (async () => {
      const ventanas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const ventana of ventanas) {
        if ('focus' in ventana) {
          await ventana.focus();
          if ('navigate' in ventana) await ventana.navigate(destino).catch(() => {});
          return;
        }
      }
      await self.clients.openWindow(destino);
    })()
  );
});
