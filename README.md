# Mis Finanzas

Progressive Web App (PWA) para el registro y control de ingresos y egresos personales. Permite capturar movimientos de dinero en pocos segundos, visualizar el balance disponible y el comportamiento mensual del gasto, y consultar un historial completo y editable de todas las transacciones. La interfaz sigue el sistema de diseño de iOS y está pensada para uso móvil, con soporte de instalación como aplicación nativa.

## Tabla de contenidos

- [Descripción general](#descripción-general)
- [Características](#características)
- [Arquitectura y stack tecnológico](#arquitectura-y-stack-tecnológico)
- [Sistema de color](#sistema-de-color)
- [Modelo de datos](#modelo-de-datos)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Requisitos previos](#requisitos-previos)
- [Configuración del backend (Supabase)](#configuración-del-backend-supabase)
- [Instalación y desarrollo local](#instalación-y-desarrollo-local)
- [Variables de entorno](#variables-de-entorno)
- [Despliegue en GitHub Pages](#despliegue-en-github-pages)
- [Instalación en dispositivos móviles](#instalación-en-dispositivos-móviles)
- [Seguridad](#seguridad)
- [Scripts disponibles](#scripts-disponibles)
- [Limitaciones conocidas](#limitaciones-conocidas)

## Descripción general

La aplicación resuelve un problema concreto: registrar de forma rápida y sin fricción cada entrada o salida de dinero del día a día, y disponer de una vista resumida y de un historial confiable para consultarlos después. No requiere hoja de cálculo ni aplicación de escritorio: se instala directamente desde el navegador del celular y funciona como una aplicación nativa (PWA).

Cada usuario autenticado tiene sus propios datos, almacenados en una base de datos Postgres administrada por Supabase, con aislamiento garantizado mediante políticas de Row Level Security (RLS).

## Características

- Registro de movimientos en dos pasos: tipo (entrada o salida), monto, descripción y categoría.
- Categorías completamente personalizables (crear y eliminar) desde la propia interfaz.
- Fecha de registro y semana del mes calculadas automáticamente, sin intervención del usuario.
- Pantalla de resumen con:
  - Balance disponible (suma de ingresos menos egresos).
  - Gráfico comparativo de ingresos y egresos de los últimos seis meses.
  - Gráfico de gastos del mes en curso, desglosado por categoría.
- Historial completo de movimientos, agrupado por mes, con edición y eliminación de cualquier registro.
- Autenticación sin contraseña mediante enlace mágico enviado por correo electrónico (Supabase Auth).
- Aislamiento de datos por usuario mediante Row Level Security a nivel de base de datos.
- Instalable como PWA (ícono propio, pantalla completa, funciona con la app cerrada en segundo plano).
- Interfaz construida siguiendo el lenguaje visual de iOS: tipografía del sistema, colores del sistema, tarjetas y hojas modales (sheets), barra de navegación inferior traslúcida.
- Soporte de modo claro y oscuro basado en la preferencia del sistema operativo.

## Arquitectura y stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework de interfaz | React 19 + TypeScript |
| Empaquetado / build | Vite |
| Enrutamiento | React Router (`HashRouter`, compatible con GitHub Pages) |
| Backend / base de datos | Supabase (PostgreSQL, Auth, Row Level Security) |
| Cliente de datos | `@supabase/supabase-js` |
| Visualización de datos | Recharts |
| Progresive Web App | `vite-plugin-pwa` (manifest y service worker) |
| Estilos | CSS con variables de diseño, sin framework de utilidades |
| Hosting / CI-CD | GitHub Pages, desplegado mediante GitHub Actions |

La aplicación es una SPA (Single Page Application) estática: no existe un servidor propio. Toda la persistencia y autenticación se delegan a Supabase, consumido directamente desde el navegador mediante su cliente JavaScript y protegido por políticas de seguridad a nivel de fila.

## Sistema de color

El esquema de color de la interfaz sigue la especificación en [`docs/paleta-color.md`](docs/paleta-color.md) (sistema "Saldo", estilo Apple HIG). Regla de oro: **verde y rojo están reservados exclusivamente para representar dinero** (ingreso/egreso); ningún botón, tab o elemento de navegación puede tomar prestado esos colores, y todo monto siempre lleva el signo `+`/`-` en texto, nunca solo el color. Los tokens (`--brand`, `--income`, `--expense`, `--surface`, `--label`, etc.) están definidos como variables CSS en [`src/styles/theme.css`](src/styles/theme.css), con sus valores de claro/oscuro resueltos automáticamente vía `prefers-color-scheme`, sin lógica condicional en los componentes.

## Modelo de datos

La base de datos define dos tablas principales, documentadas junto con sus políticas de seguridad en [`supabase/schema.sql`](supabase/schema.sql).

### `categorias`

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | `uuid` | Identificador único, generado automáticamente. |
| `user_id` | `uuid` | Propietario del registro (referencia a `auth.users`). |
| `nombre` | `text` | Nombre visible de la categoría. |
| `created_at` | `timestamptz` | Fecha de creación. |

### `transacciones`

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | `uuid` | Identificador único, generado automáticamente. |
| `user_id` | `uuid` | Propietario del registro. |
| `fecha` | `timestamptz` | Momento del registro, asignado automáticamente al guardar. |
| `item` | `text` | Descripción del movimiento, ingresada manualmente. |
| `categoria_id` | `uuid` | Referencia a `categorias`. |
| `tipo` | `text` | `ingreso` o `egreso`. |
| `monto` | `numeric` | Valor del movimiento (mayor que cero). |
| `semana_del_mes` | `int` | Semana del mes (1 a 5), calculada automáticamente a partir de la fecha. |
| `created_at` | `timestamptz` | Fecha de creación del registro. |

Ambas tablas tienen Row Level Security habilitado con una política que restringe toda operación (lectura, escritura, actualización y borrado) a las filas donde `user_id` coincide con el usuario autenticado (`auth.uid()`).

## Estructura del proyecto

```
finanzas-pwa/
  src/
    auth/                  Contexto de autenticación y pantalla de login
    components/            Componentes de interfaz reutilizables (gráficos, tab bar, hojas modales)
    data/                  Contexto de datos de la aplicación (transacciones y categorías)
    pages/                 Pantallas de la aplicación (Resumen, Historial)
    styles/                Variables de diseño y estilos compartidos
    utils/                 Utilidades de fecha, moneda y cálculo de semana del mes
    db.ts                  Capa de acceso a datos (consultas a Supabase)
    supabaseClient.ts      Instancia del cliente de Supabase
    types.ts               Tipos compartidos del dominio
  public/
    icons/                 Íconos de la PWA en distintos tamaños
  supabase/
    schema.sql             Definición de tablas y políticas de seguridad
  .github/workflows/
    deploy.yml             Flujo de integración y despliegue continuo a GitHub Pages
  vite.config.ts           Configuración de Vite y del plugin de PWA
```

## Requisitos previos

- Node.js 20 o superior.
- Una cuenta gratuita en [Supabase](https://supabase.com).
- Una cuenta en GitHub, si se desea publicar el sitio.

## Configuración del backend (Supabase)

1. Crear una cuenta en [supabase.com](https://supabase.com) y un nuevo proyecto (**New project**).
2. En el **SQL Editor** del proyecto, ejecutar el contenido completo de [`supabase/schema.sql`](supabase/schema.sql). Esto crea las tablas `categorias` y `transacciones`, sus índices y las políticas de Row Level Security.
3. En **Project Settings → API Keys**, obtener:
   - La **Project URL**.
   - La **Publishable key** (también llamada `anon` en proyectos anteriores). Esta clave está diseñada para exponerse en el navegador; la protección real de los datos la proporciona RLS, no la confidencialidad de esta clave.
4. En **Authentication → Providers**, confirmar que el proveedor **Email** esté habilitado (viene activo por defecto). Este proveedor es el que sustenta el inicio de sesión mediante enlace mágico.
5. En **Authentication → URL Configuration → Redirect URLs**, agregar las URLs desde las que se accederá a la aplicación, por ejemplo:
   - `http://localhost:5173/**` para desarrollo local.
   - `https://<usuario>.github.io/**` para producción.

## Instalación y desarrollo local

```bash
npm install
cp .env.example .env.local
```

Completar `.env.local` con los valores obtenidos de Supabase (ver [Variables de entorno](#variables-de-entorno)).

```bash
npm run dev
```

La consola indicará la URL local (por defecto `http://localhost:5173`). Al abrirla, la aplicación solicitará un correo electrónico y enviará un enlace de acceso sin contraseña.

## Variables de entorno

| Variable | Descripción |
|---|---|
| `VITE_SUPABASE_URL` | URL del proyecto de Supabase. |
| `VITE_SUPABASE_ANON_KEY` | Clave pública (`publishable`/`anon`) del proyecto de Supabase. |

Estas variables se leen en tiempo de build por Vite y quedan embebidas en el bundle final del cliente, como corresponde a una aplicación estática sin backend propio. No debe utilizarse la clave `secret`/`service_role` en ningún archivo de este proyecto.

## Despliegue en GitHub Pages

El repositorio incluye un flujo de GitHub Actions ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)) que construye y publica la aplicación automáticamente en cada `push` a la rama `main`.

1. En el repositorio de GitHub, ir a **Settings → Pages** y establecer el origen (**Source**) en **GitHub Actions**.
2. En **Settings → Secrets and variables → Actions**, registrar dos secretos:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
3. Confirmar que `base` en `vite.config.ts`, y `start_url` / `scope` en la configuración del manifest de la PWA, coincidan con el nombre del repositorio (`/finanzas-pwa/` en este caso). Si el repositorio se renombra, estos valores deben actualizarse.
4. Realizar un `push` a `main`. El flujo compila el proyecto y publica el contenido de `dist/` en GitHub Pages.
5. Agregar la URL publicada (`https://<usuario>.github.io/finanzas-pwa/`) a la lista de **Redirect URLs** en Supabase, de lo contrario el enlace mágico de acceso no podrá completar la redirección en producción.

## Instalación en dispositivos móviles

Desde Safari en iOS: abrir la URL publicada, pulsar el botón de compartir y seleccionar **Agregar a pantalla de inicio**. La aplicación queda instalada con ícono propio y se ejecuta en modo de pantalla completa, sin la interfaz del navegador.

En Android, Chrome ofrece un mecanismo equivalente (**Instalar aplicación** o **Agregar a pantalla de inicio**).

## Seguridad

- La autenticación es sin contraseña (enlace mágico por correo electrónico), gestionada íntegramente por Supabase Auth.
- El aislamiento de datos entre usuarios se garantiza mediante Row Level Security en PostgreSQL: cada consulta está restringida por la base de datos al usuario autenticado, independientemente de lo que el cliente solicite.
- La clave pública de Supabase incluida en el bundle no otorga acceso a datos ajenos; su exposición en el código cliente es el modelo de uso previsto por Supabase para aplicaciones sin backend propio.
- La clave `secret`/`service_role` del proyecto de Supabase no se utiliza ni se almacena en ningún punto de este repositorio y no debe incorporarse a él bajo ninguna circunstancia.

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Levanta el servidor de desarrollo con recarga en caliente. |
| `npm run build` | Genera la build de producción en `dist/` (incluye manifest y service worker de la PWA). |
| `npm run preview` | Sirve localmente la build de producción generada. |
| `npm run lint` | Ejecuta el linter (Oxlint) sobre el código fuente. |

## Limitaciones conocidas

- La aplicación requiere conexión a internet para leer y escribir datos; el service worker únicamente cachea el shell de la interfaz, no el contenido dinámico.
- No existe actualmente exportación ni respaldo manual de los datos fuera de Supabase.
- El acceso a la aplicación depende de que el correo del usuario esté habilitado como proveedor de autenticación y de que las URLs de redirección estén correctamente configuradas en Supabase.
