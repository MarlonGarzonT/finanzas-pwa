import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/finanzas-pwa/',
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
      manifest: {
        name: 'Mis Finanzas',
        short_name: 'Finanzas',
        description: 'Registra tus entradas y salidas de dinero al día.',
        theme_color: '#f2f2f7',
        background_color: '#f2f2f7',
        display: 'standalone',
        start_url: '/finanzas-pwa/',
        scope: '/finanzas-pwa/',
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
