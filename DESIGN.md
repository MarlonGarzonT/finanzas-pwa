# Mis Finanzas — Sistema de diseño

> Una app de finanzas personales que se siente nativa de iPhone. La interfaz es **Konsta UI 5 con tema iOS (iOS 26, Liquid Glass)** sobre Tailwind v4; este documento fija lo que es propio de la app encima de eso.

**Fuente de verdad:** los componentes de Konsta definen la forma de los controles (barras, listas, hojas, botones, segmentados, toggles). Este archivo define color de dinero, tipografía de montos, iconografía, espaciado de pantallas y reglas de uso. Si algo no está aquí, se usa el componente de Konsta tal cual, sin restilizarlo.

**Modo:** Operate. La persona viene a registrar o revisar plata; la interfaz desaparece en la tarea. Familiaridad iOS > expresión.

**Claro y oscuro:** ambos son de primera clase. La clase `dark` en `<html>` sigue a `prefers-color-scheme` (ver `src/main.tsx`); Konsta y los tokens propios responden a esa clase.

## Stack de UI

| Pieza | Uso |
|---|---|
| `konsta/react` (`theme="ios"`) | Todos los controles y estructuras |
| Tailwind v4 (`@tailwindcss/vite`) | Utilidades y tokens (`src/index.css`) |
| Componentes propios | Solo donde Konsta no tiene equivalente: gráficos, rueda de mes, campo de monto, hoja inferior con gestos |

## Color

Acento único (tint): **azul del sistema iOS `#007aff`** (`--color-brand-primary`). Solo para acciones, selección y estado; nunca decoración.

### Dinero (estilo Apple Card)

**Solo el ingreso lleva color.** El gasto se escribe en el color normal del texto (negro en claro, blanco en oscuro) con su signo −; gastar es lo normal y no se pinta de rojo. El signo (+/−) siempre acompaña al monto en texto; el color nunca es la única señal.

| Token Tailwind | Claro | Oscuro | Uso |
|---|---|---|---|
| `text-ingreso` | `#047857` | `#34d399` | Texto de montos que entran (esmeralda) |
| `ingreso-relleno` | `#10b981` | `#34d399` | Anillo de ahorro (no texto) |
| `text-alerta` | `#c22e12` | `#ff8d78` | Lo que sí pide atención: Disponible negativo, más gasto que el mes pasado, errores, acciones destructivas |
| `alerta-relleno` | `#f0563c` | `#ff7a63` | Anillo de ahorro negativo (no texto) |

"Alerta" no es sinónimo de "gasto": nunca se usa para pintar un gasto normal. Los tonos de texto en claro pasan 4.5:1 sobre blanco y sobre el gris agrupado.

Los gráficos que comparan categorías (barras de Resumen, dona de Reportes) usan el **color de cada categoría**, no verde/rojo.

### Neutros

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `text-secundario` | `rgb(60 60 67 / .75)` | `rgb(235 235 245 / .6)` | Texto de apoyo, subtítulos, vacíos |
| `pista` | `rgb(120 120 128 / .16)` | `/ .32` | Fondo de anillos, barras y "Otras" en la dona |
| Superficies | las de Konsta (`ios-light-surface*`, `ios-dark-surface*`) | | Fondo agrupado gris + listas blancas |

El secundario está más oscuro que el `secondaryLabel` de iOS (60%) a propósito: así cumple WCAG AA sobre blanco y sobre el gris agrupado.

### Identidad de categorías y miembros

`--categoria-azul, -naranja, -morado, -cian, -rosa, -menta, -amarillo, -cafe`. Se asignan por hash del id (`colorCategoria`). Nunca para dinero ni para el acento. En avatares van como **tinte** (22–35%) detrás del emoji o la inicial, no como relleno pleno, para no romper contraste.

## Tipografía

Fuente del sistema (SF Pro en Apple, `font-ios` de Konsta). Una sola familia.

| Rol | Tamaño / peso |
|---|---|
| Título de pantalla | Navbar compacto de Konsta, centrado (17px, semibold) |
| Monto protagonista | Disponible 48px bold, campo de monto 44px bold; tracking -0.03em, `cifras` |
| Cuerpo / filas | 17px (Konsta) |
| Montos en filas | 17px semibold, color de dinero |
| Apoyo | 15px `text-secundario` |
| Pie / microcopy | 13px |

Todo monto lleva la clase `.cifras` (`tabular-nums`) para que las columnas no bailen.

## Iconografía

Set propio en `src/components/Iconos.tsx`: grilla 24px, trazo 1.8, extremos redondeados, imitando SF Symbols. Nada de emojis o glifos Unicode como íconos de interfaz. Los emojis son **contenido** elegido por la persona (identidad de la categoría) y van ocultos al lector de pantalla.

## Estructura de pantallas

- **Navegación:** `Tabbar` + `ToolbarPane` de Konsta (cápsula Liquid Glass flotante) con 4 secciones: Resumen, Historial, Reportes, Grupos. Detalle de grupo se apila con `NavbarBackLink`.
- **Pantallas de primer nivel:** `Page` + `Navbar centerTitle` compacto (título centrado arriba, alineado con los botones de vidrio). Sin `large` ni `transparent`: el título grande quedaba bajo y a la izquierda, y `transparent` lo oculta hasta hacer scroll.
- **Resumen:** selector de mes en texto discreto (‹ Mes ⌄ ›), "Disponible" grande sin signo si es positivo (con − y color de alerta si es negativo) y un `SelectorVidrio` con Gastos / Ingresos (etiqueta + total) que filtra el gráfico. Su resaltado se desliza con curva de resorte iOS (clase `.selector-fluido`, 420 ms, solo `transform`).
- **Contenido:** `BlockTitle` + `List strong inset dividers` (listas agrupadas) o `Block strong inset rounded-3xl` (tarjetas de gráfico). No se pisan los márgenes verticales de Konsta (`my-*`) en bloques que siguen a un `BlockTitle`.
- **Espaciado inferior variable:** nunca alturas fijas para la barra de pestañas. `--margen-inferior` = máx(12px, área segura − 10px) y `--alto-pestanas` = margen + 64px (en `.k-app`, `index.css`). La cápsula queda a ~24px del borde en iPhone con barra de inicio y a 12px sin ella. Usar las clases `pagina-con-pestanas`, `pagina-con-fab`, `fab-sobre-pestanas` y `pie-seguro` en vez de `calc(...px)` a mano.
- **Acción principal:** `Fab` de 56px, abajo a la derecha, sobre la barra de pestañas (al alcance del pulgar).
- **Menús de acciones:** `Actions` (hoja de acciones iOS), nunca menús flotantes propios.
- **Destructivo:** `DialogoConfirmar` (alerta iOS) antes de eliminar.
- **Formularios:** `HojaInferior` → cabecera con asa, "Cancelar" a la izquierda y título centrado; campos en `List strong inset` con `CampoTexto`; acción principal `Button large rounded` anclada abajo.

## Componentes propios

| Componente | Por qué existe |
|---|---|
| `HojaInferior` | Sheet de Konsta + montaje diferido, asa para cerrar arrastrando, anclaje al teclado de iOS (visualViewport), Escape, `role="dialog"`, portal a `#capa-hojas` |
| `CampoTexto` | `ListInput` con `<label>` real asociado y `enterkeyhint` (el de Konsta no los da) |
| `CampoMonto` | Monto grande centrado, solo dígitos, separador de miles, ancho que sigue a las cifras |
| `SelectorVidrio` / `OpcionSelector` | `Segmented` de Konsta con material Liquid Glass (riel de vidrio con reflejos, resaltado tipo gota que se desliza con resorte). Se usa en **todos** los selectores de la app; no usar `Segmented` directo |
| `AvisoActualizacion` | Cápsula Liquid Glass (`Glass` de Konsta) que baja desde arriba con rebote cuando hay versión nueva: ícono con halo y flecha que flota, botón "Actualizar" con destello, "Ahora no" para descartarla hasta volver a la app. La lógica vive en `useActualizacionApp` (SW en modo `prompt`) |
| `BalanceMes` | Tarjeta al inicio de Reportes con el balance del mes elegido: balance grande con signo, etiqueta de estado ("Vas bien" <80% de lo que entró, "Ojo" 80–100%, "Te pasaste" >100%, "Sin ingresos") y frase, más dos barras en la misma escala (Entró esmeralda / Salió neutra, coral si superó lo que entró). El estado siempre va en texto |
| `GraficoMensual` | Últimos 6 meses en columnas pareadas Entró / Salió (coral si ese mes se gastó más de lo que entró). Cada columna es un botón que abre ese mes; la ventana termina en el mes actual y no se mueve al tocar |
| `SelectorCategoria` | Cuadrícula de 4 columnas para elegir la categoría de un movimiento: emoji sobre el color de la categoría, nombre debajo, anillo + ✓ con rebote en la elegida y "Nueva" punteada al final. Ordena por uso real (`useCategoriasPorUso`) y preselecciona la más usada. Es un `radiogroup`. Va justo debajo del monto |
| `ChipOpcion` | `Chip` de Konsta seleccionable, 36px visibles con área táctil extendida a 44px |
| `RuedaSelector` | Picker de rueda tipo UIPickerView (Konsta no lo trae), con `listbox` y flechas de teclado |
| `FilaMovimiento` | Fila de lista de un movimiento, compartida por Resumen e Historial |
| Gráficos (`GraficoGastos`, `DonaCategorias`, `BarraFijoVariable`, `GraficoSemanal`) | SVG/CSS propios, con texto alternativo para lector de pantalla |

## Movimiento

- Transiciones de Konsta para hojas, alertas y pestañas (no se reemplazan).
- Gráficos: crecen una vez al montar (700 ms, ease-out exponencial). Al cambiar de mes se reinician.
- Contenido de pantalla: aparece con `aparecer-suave` (400 ms, `opacity` + `transform`).
- `prefers-reduced-motion`: todas las animaciones y transiciones se reducen a ~0.

## Accesibilidad (piso)

- Contraste AA en texto y placeholders (placeholders al 55% en claro, 50% en oscuro; el "0" del monto al 45% por ser texto grande).
- Áreas táctiles ≥ 44×44: segmentos forzados a 44px, chips con área extendida, botones de icono `size-11`.
- Foco visible en controles (anillo del color de acento); en campos de texto marca el cursor, como en iOS.
- Iconos solo-icono con `aria-label`; selección con `aria-pressed`; errores con `role="alert"`.

## No hacer

- No restilizar componentes de Konsta con colores o radios propios fuera de los tokens de arriba.
- No pintar gastos de rojo ni usar el esmeralda fuera de ingresos; el coral de alerta solo para lo que pide atención. El azul no es decoración.
- No volver a glassmorphism hecho a mano: el vidrio lo ponen `Navbar`, `ToolbarPane`, `Fab`, `Actions` y `SelectorVidrio`, todos con los materiales de vidrio de Konsta.
- No usar emojis como íconos de interfaz.
- No sobrescribir `my-*` en `Block`/`List` que siguen a un `BlockTitle` (el título se esconde detrás).
