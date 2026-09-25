import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// El Service Worker (registerType: 'autoUpdate') se activa solo en segundo
// plano tras cada deploy, pero no recarga la pestaña ya abierta: sin esto,
// la primera visita después de un deploy sigue corriendo el JS viejo hasta
// que el usuario refresca a mano.
if ('serviceWorker' in navigator) {
  let recargando = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (recargando) return;
    recargando = true;
    window.location.reload();
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
