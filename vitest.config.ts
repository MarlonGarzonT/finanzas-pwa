import { defineConfig } from 'vitest/config';

// Config aparte de vite.config.ts para no cargar el plugin PWA en las pruebas.
// La zona horaria fija hace que los casos de borde (un gasto del 31 a las
// 9 p. m. en Colombia ya es otro mes en UTC) den igual en cualquier máquina.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    env: { TZ: 'America/Bogota' },
  },
});
