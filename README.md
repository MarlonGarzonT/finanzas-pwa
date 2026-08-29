# Mis Finanzas

PWA para registrar entradas y salidas de dinero diarias, con gráfico de balance mensual e historial completo. Diseño estilo iOS, instalable en el celular como app.

## 1. Crear el proyecto de Supabase (una sola vez)

1. Entra a [supabase.com](https://supabase.com) y crea una cuenta gratis.
2. Crea un **New project** (elige nombre, contraseña de base de datos y región).
3. Cuando esté listo, ve a **SQL Editor**, pega el contenido de [`supabase/schema.sql`](supabase/schema.sql) y ejecútalo. Esto crea las tablas `categorias` y `transacciones` con seguridad a nivel de fila (cada quien solo ve lo suyo).
4. Ve a **Settings → API** y copia:
   - **Project URL**
   - **anon public key**
5. Ve a **Authentication → Providers → Email** y confirma que el login con "magic link" esté habilitado (viene activo por defecto).

## 2. Configurar el proyecto localmente

```bash
npm install
cp .env.example .env.local
```

Edita `.env.local` con la URL y la anon key que copiaste:

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

```bash
npm run dev
```

Abre la URL que aparece en la terminal, ingresa tu correo y revisa tu bandeja de entrada para el enlace mágico.

## 3. Publicar en GitHub Pages

1. Crea un repositorio en GitHub (por ejemplo `finanzas-pwa`) y súbele este código.
2. En el repo, ve a **Settings → Pages** y selecciona la fuente **GitHub Actions**.
3. En **Settings → Secrets and variables → Actions**, agrega dos secrets:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
4. Cada `push` a `main` construye y publica el sitio automáticamente (ver `.github/workflows/deploy.yml`).
5. Si el nombre del repositorio no es `finanzas-pwa`, ajusta `base` en `vite.config.ts` (y `start_url`/`scope` del manifest) al nombre real: `/tu-repo/`.

## 4. Instalar en el iPhone

Abre la URL publicada en Safari → botón compartir → **"Agregar a pantalla de inicio"**. Queda como una app normal, con su propio ícono.

## Scripts

- `npm run dev` — servidor de desarrollo
- `npm run build` — build de producción
- `npm run preview` — sirve el build localmente
