import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// Versión visible en el Perfil, para saber qué build tiene cada teléfono al
// dar soporte: fecha del build y, en GitHub Actions, el commit corto.
const fechaBuild = new Date().toISOString().slice(0, 10);
const commit = process.env.GITHUB_SHA?.slice(0, 7);

// Ruta donde se publica la app. En el hosting principal va en la raíz (link
// corto); GitHub Pages la sirve en /finanzas-pwa/ y la fija su workflow.
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  base,
  define: {
    __VERSION_APP__: JSON.stringify(commit ? `${fechaBuild} (${commit})` : `${fechaBuild} (local)`),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // 'prompt': la versión nueva queda esperando hasta que la persona toque
      // "Actualizar" (AvisoActualizacion); así nunca se recarga a mitad de un
      // formulario. El registro lo hace useActualizacionApp, no un script.
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['apple-touch-icon.png'],
      // sw-transicion.js: puente para ventanas con la versión vieja (sin
      // aviso). sw-push.js: muestra los avisos de préstamos vencidos.
      workbox: {
        importScripts: ['sw-transicion.js', 'sw-push.js'],
      },
      manifest: {
        name: 'Mi Cuadre',
        short_name: 'Mi Cuadre',
        description: 'Registra tus entradas y salidas de dinero al día.',
        theme_color: '#f2f2f7',
        background_color: '#f2f2f7',
        display: 'standalone',
        start_url: base,
        scope: base,
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
});
