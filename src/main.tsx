import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { iniciarTema } from './utils/tema'

// Cuando el Service Worker nuevo toma el control (la persona tocó
// "Actualizar", aquí o en otra pestaña), esta pestaña recarga: si siguiera
// con el JS viejo, pediría chunks que el deploy ya borró.
if ('serviceWorker' in navigator) {
  let recargando = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (recargando) return;
    recargando = true;
    window.location.reload();
  });

  // Contesta al Service Worker nuevo que esta ventana sabe mostrar el aviso
  // "Nueva versión" (public/sw-transicion.js): así espera a que la persona
  // toque "Actualizar" en vez de activarse solo.
  navigator.serviceWorker.addEventListener('message', (evento) => {
    if (evento.data?.tipo === 'FINANZAS_SOPORTA_AVISO') evento.ports[0]?.postMessage(true);
  });
  navigator.serviceWorker.startMessages();
}

iniciarTema();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
