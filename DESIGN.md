# Mi Cuadre — Sistema de diseño

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
| `text-alerta` | `#c22e12` | `#ff8d78` | Lo que sí pide atención: Disponible negativo, gastar más de lo que entró, errores, acciones destructivas |
| `alerta-relleno` | `#f0563c` | `#ff7a63` | Anillo de ahorro negativo (no texto) |

"Alerta" no es sinónimo de "gasto": nunca se usa para pintar un gasto normal. Tampoco para "más gasto que el mes pasado" (`ComparacionMes` va en color neutro en los dos sentidos): gastar más que el mes anterior no siempre es malo (SOAT, matrícula); la flecha y el texto ya dicen la dirección. Los tonos de texto en claro pasan 4.5:1 sobre blanco y sobre el gris agrupado.

Los gráficos que comparan categorías (barras de Resumen, dona de Reportes) usan el **color de cada categoría**, no verde/rojo.

### Neutros

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `text-secundario` | `rgb(60 60 67 / .75)` | `rgb(235 235 245 / .6)` | Texto de apoyo, subtítulos, vacíos |
| `pista` | `rgb(120 120 128 / .16)` | `/ .32` | Fondo de anillos, barras y "Otras" en la dona |
| Superficies | las de Konsta (`ios-light-surface*`, `ios-dark-surface*`) | | Fondo agrupado gris + listas blancas |

El secundario está más oscuro que el `secondaryLabel` de iOS (60%) a propósito: así cumple WCAG AA sobre blanco y sobre el gris agrupado.

### Logros (perfil)

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `--logro` | `#ff9500` | `#ff9500` | Medalla del hito alcanzado y barra de avance hacia el siguiente (no texto) |
| `--logro-texto` | `#9a5200` | `#ffb340` | Texto del Chip de la medalla sobre `--logro` al 15% (pasa 4.5:1) |

Solo para la permanencia del usuario en el perfil: nunca dinero, alertas ni acento.

### Exportar a Excel

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `--verde-excel` | `#107c41` | `#107c41` | Cuadro del ícono de hoja de cálculo y brillo detrás del vidrio (no texto) |
| `--verde-excel-texto` | `#0b6534` | `#4cc38a` | Flecha de descarga sobre `--verde-excel` al 12% |

Solo en `TarjetaExportar`: el verde identifica el archivo, no es "ingreso".

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

- **Navegación:** `Tabbar` + `ToolbarPane` de Konsta (cápsula Liquid Glass flotante) con 5 secciones: Resumen, Historial, Reportes, Préstamos y Perfil. Préstamos lleva una `Badge` de Konsta sobre el ícono con los vencidos (con la cifra en el `aria-label` del enlace). Las pantallas que se apilen usan `NavbarBackLink`.
- **Pantallas de primer nivel:** `Page` + `Navbar centerTitle` compacto (título centrado arriba, alineado con los botones de vidrio). Sin `large` ni `transparent`: el título grande quedaba bajo y a la izquierda, y `transparent` lo oculta hasta hacer scroll.
- **Resumen:** selector de mes en texto discreto (‹ Mes ⌄ ›), "Disponible" grande sin signo si es positivo (con − y color de alerta si es negativo) y un `SelectorVidrio` con Gastos / Ingresos (etiqueta + total) que filtra el gráfico. Su resaltado se desliza con curva de resorte iOS (clase `.selector-fluido`, 420 ms, solo `transform`).
- **Contenido:** `BlockTitle` + `List strong inset dividers` (listas agrupadas) o `Block strong inset rounded-3xl` (tarjetas de gráfico). No se pisan los márgenes verticales de Konsta (`my-*`) en bloques que siguen a un `BlockTitle`.
- **Espaciado inferior variable:** nunca alturas fijas para la barra de pestañas. `--margen-inferior` = máx(12px, área segura − 10px) y `--alto-pestanas` = margen + 64px (en `.k-app`, `index.css`). La cápsula queda a ~24px del borde en iPhone con barra de inicio y a 12px sin ella. Usar las clases `pagina-con-pestanas`, `pagina-con-fab`, `fab-sobre-pestanas` y `pie-seguro` en vez de `calc(...px)` a mano.
- **Acción principal:** botón flotante de 56px (`BotonFlotante`), abajo a la derecha, sobre la barra de pestañas (al alcance del pulgar). Es el único botón de la app con efectos de React Bits, por pedido del usuario (excepción a "Konsta tal cual", que sigue valiendo para el resto): una luz blanca da la vuelta al contorno (`StarBorder`, con un pulso al tocarlo; solo el "+" en Resumen, "+ Nuevo préstamo" con texto en Préstamos) y, si lleva texto, un destello recorre las letras (`ShinyText`). Los efectos van en un chunk aparte (`BotonFlotanteEfectos`, `lazy`) y, mientras llega, se ve el mismo botón sin ellos. Con "reducir movimiento" la luz queda quieta.
- **Menús de acciones:** `Actions` (hoja de acciones iOS), nunca menús flotantes propios.
- **Destructivo:** `DialogoConfirmar` (alerta iOS) antes de eliminar.
- **Movimiento nuevo por pasos:** la hoja "Nuevo movimiento" se llena en tres pasos (1 Salida/Entrada + monto, 2 categoría, 3 descripción + fecha con atajos Hoy/Ayer), con una barra de progreso de tres segmentos bajo el título y "‹ Atrás" en lugar de "Cancelar" a partir del paso 2 (se cierra con el asa o tocando fuera). Cada paso lleva un título corto (¿Cuánto fue? / ¿En qué se fue? o ¿De dónde vino? / Ponle nombre y fecha). Elegir una categoría avanza solo tras 260 ms (el aro y el ✓ alcanzan a verse); "Continuar" sirve para aceptar la preseleccionada. El último paso repite lo elegido (`ResumenMovimiento`: categoría y monto, cada uno vuelve a su paso). El teclado se cierra al salir del monto y la descripción se enfoca al llegar al paso 3. **Editar** un movimiento existente no usa pasos: muestra monto, categoría, descripción y fecha a la vez. La lógica vive en `useFormularioMovimiento`.
- **Sin texto plano:** la información importante nunca va en una frase suelta; va en **segmentos** (`Segmentos`: una banda con una celda por dato, etiqueta pequeña arriba y valor debajo, separadas por una línea fina) o, si es una nota que sí hace falta, en un **aviso** (`Aviso`: recuadro con ícono "i"). Cada dato se escanea sin leer. Títulos, etiquetas de campo y botones sí son texto normal; lo que no es lo bastante importante para un segmento se quita. Aplicado en Créditos; el resto de la app se va pasando a este criterio al tocarlo.
- **Formularios:** `HojaInferior` → cabecera con asa, "Cancelar" a la izquierda y título centrado; campos en `List strong inset` con `CampoTexto`; acción principal `Button large rounded` anclada abajo.

## Componentes propios

| Componente | Por qué existe |
|---|---|
| `HojaInferior` | Sheet de Konsta + montaje diferido, asa para cerrar arrastrando, anclaje al teclado de iOS (visualViewport), Escape, `role="dialog"`, portal a `#capa-hojas` |
| `CampoTexto` | `ListInput` con `<label>` real asociado y `enterkeyhint` (el de Konsta no los da) |
| `CampoMonto` | Monto grande centrado, solo dígitos, separador de miles, ancho que sigue a las cifras |
| `SelectorVidrio` / `OpcionSelector` | `Segmented` de Konsta con material Liquid Glass (riel de vidrio con reflejos, resaltado tipo gota que se desliza con resorte). Se usa en **todos** los selectores de la app; no usar `Segmented` directo |
| `AvisoActualizacion` | Cápsula Liquid Glass (`Glass` de Konsta) que baja desde arriba con rebote cuando hay versión nueva: ícono con halo y flecha que flota, botón "Actualizar" con destello, "Ahora no" para descartarla hasta volver a la app. La lógica vive en `useActualizacionApp` (SW en modo `prompt`) |
| Perfil (`CabeceraPerfil`, `AvatarUsuario`, `IconoAjuste`) | Estilo cuenta de Apple en Ajustes: foto de Google (o iniciales sobre el acento), nombre, correo y método de inicio; debajo, la permanencia como protagonista (`TarjetaAntiguedad`: tiempo en la app en meses de calendario a 56px, Chip con la medalla del último hito y `Progressbar` de Konsta hacia el siguiente; hitos de 1 semana a 5 años en `utils/antiguedad.ts`) y "Tu constancia" (`ConstanciaMeses`: racha de meses seguidos, una barra por mes de los últimos 6 y total/promedio); "Exportar a Excel" como tarjeta de vidrio (`TarjetaExportar`: `Glass` de Konsta sobre un brillo verde Excel recortado a la tarjeta; en reposo la flecha baja cada 2.8 s y un destello la cruza; Preloader al generar y ✓ "Excel descargado" por 3 s); resto de ajustes en listas agrupadas con cuadro de color + ícono blanco a la izquierda (gris apariencia/contraseña, naranja categorías, verde exportar, rojo calendario para "Gastos del año", azul correo). Cerrar sesión centrado en coral y con confirmación. La lógica vive en `usePerfil`, `usePreferenciaTema` y `useExportarExcel` |
| `BalanceMes` | Tarjeta al inicio de Reportes con el balance del mes elegido: balance grande con signo, etiqueta de estado ("Vas bien" <80% de lo que entró, "Ojo" 80–100%, "Te pasaste" >100%, "Sin ingresos") y frase, más dos barras en la misma escala (Entró esmeralda / Salió neutra, coral si superó lo que entró). "Salió" son solo gastos: si hubo ahorro, una línea de apoyo dice "Separaste $X para ahorro" (lo mismo bajo el Disponible del Resumen). El estado siempre va en texto |
| `GraficoMensual` | Últimos 6 meses en columnas pareadas Entró / Salió (coral si ese mes se gastó más de lo que entró). Cada columna es un botón que abre ese mes; la ventana termina en el mes actual y no se mueve al tocar |
| `SelectorCategoria` | Cuadrícula de 4 columnas para elegir la categoría de un movimiento: emoji sobre el color de la categoría, nombre debajo, anillo + ✓ con rebote en la elegida y "Nueva" punteada al final. Ordena por uso real (`useCategoriasPorUso`) y preselecciona la más usada. Es un `radiogroup`. Va justo debajo del monto |
| `ChipOpcion` | `Chip` de Konsta seleccionable, 36px visibles con área táctil extendida a 44px |
| `RuedaSelector` | Picker de rueda tipo UIPickerView (Konsta no lo trae), con `listbox` y flechas de teclado |
| `FilaMovimiento` | Fila de lista de un movimiento, compartida por Resumen e Historial |
| Gráficos (`GraficoGastos`, `DonaCategorias`, `BarraFijoVariable`) | SVG/CSS propios, con texto alternativo para lector de pantalla |
| Naturaleza de la categoría (`EditarCategoriaSheet`) | Bloque "Cómo cuenta": lista de radios de Konsta (`ListItem label` + `Radio`) con la etiqueta y ejemplos de cada naturaleza según el tipo; el toggle de gasto fijo solo aparece para necesario, prescindible o cuota de crédito. En `GestionCategorias` la naturaleza va como segunda línea de cada fila (no al lado: no cabe a 360px). Crear una categoría no pide la naturaleza: se sugiere por el nombre |
| Préstamos (`pages/Prestamos`, `CabeceraPrestamos`, `ListaPrestamos`, `TarjetaPrestamo`, `PrestamosVacio`, `NuevoPrestamoSheet`, `DetallePrestamoSheet`, `EditarPrestamoSheet`, `AbonoSheet`, `AvisosPrestamosSheet`) | Es la pestaña de la plata prestada en las dos direcciones: arriba un `SelectorVidrio` **"Te deben | Debes"** (se recuerda la última vista en `localStorage`, clave `mi-cuadre:vista-prestamos`) y la campana de avisos; "Te deben" es lo que sigue y "Debes" son los créditos (fila de abajo). "Te deben" es la plata que prestaste, escrita en lenguaje de todos los días (se habla de "pagos", no de "abonos"). **Cabecera:** solo el monto prestado en 48px (`MontoAnimado`, sin rótulo encima) y, si hay deudores, una frase ("3 personas te deben · 1 se pasó de fecha", lo vencido en coral; sin deudores no hay frase) y, cuando ya devolvieron algo, una barra verde con "Te han devuelto $X de $Y" que se llena al entrar (`.barra-progreso`, solo `scaleX`). **Lista:** `SelectorVidrio` "Por cobrar · n / Pagados · n" (solo aparece si hay pagados) y una **tarjeta por persona** (`TarjetaPrestamo`): avatar de iniciales con el color de la persona (`AvatarPersona`), nombre, estado en palabras con punto ("Te paga mañana", "Te paga en 3 días", "Te paga el 13 de dic", "Venció hace 4 días", ✓ "Te pagó el 15 de nov"; el punto es coral solo si venció, azul si es en los próximos 7 días), saldo a la derecha ("de $400.000" y una barra si ya pagó parte) y, abajo, el botón **"Registrar pago"** a la vista (abre el pago sin pasar por el detalle). El texto del estado sale de `describirVencimiento`. **Vacío:** "¿Le prestaste plata a alguien?" con tres pasos numerados (Anotas el préstamo → Registras cada pago → Se cierra solo) que explican que sale del Disponible sin contar como gasto. **Botón +:** `BotonFlotante` con el texto "Nuevo préstamo" (en tipo oración, con luz en el contorno y destello en las letras); al bajar por la lista queda solo el "+" para no tapar las tarjetas. **Nuevo préstamo por pasos** (misma transición push que un movimiento, `useFormularioPrestamo`): ¿A quién le prestas? (con atajos de las personas a las que más has prestado) → ¿Cuánto le prestas? → ¿Cuándo te paga? (atajos 1 semana / 15 días / 1 mes —15 días viene elegido— más fecha y nota). **Detalle:** avatar grande, "Te debe", monto, estado, barra de lo pagado ("Todavía no te ha pagado nada" / "Ya te pagó $X"), nota, "Pagos que te hizo" con papelera, Editar y Eliminar como filas de lista; "Registrar pago" anclado abajo. El pago arranca con todo el saldo y ofrece "Me pagó todo" / "La mitad"; dice en texto si queda saldado o cuánto faltaría. Saldar un préstamo desde su detalle lanza las chispas verdes de `ClickSpark` detrás del saldo. **Avisos de cobro:** una campana en la barra superior (punto verde si están encendidos) abre una hoja (`AvisosPrestamosSheet`) que explica cuándo llega el aviso y tiene el interruptor; si no se puede usar, el texto dice por qué. No van al final de la lista: con muchos préstamos quedaban enterrados. Tocar un movimiento de préstamo en Resumen o Historial abre su detalle. La lógica vive en `usePrestamos`, `useFormularioPrestamo`, `utils/prestamos` y `useNotificacionesPush` |
| Créditos, vista "Debes" (`VistaCreditos`, `TarjetaCredito`, `SuperficieVidrio`, `ResumenInteresesCreditos`, `TiraCuotas`, `BarraReparto`, `BotonPrincipal`, `CreditosVacio`, `NuevoCreditoSheet`, `DetalleCreditoSheet`, `PagoCreditoSheet`, `EditarCreditoSheet`) | Para quien paga un crédito de cuota fija (moto, carro, vivienda, libre inversión) y quiere saber **cuánto de lo que paga son intereses**. La persona escribe lo que dice su contrato (valor que le prestaron, cuota mensual, número de cuotas, cuántas lleva pagadas y cuándo vence la próxima); la app calcula la tasa implícita de las cuotas (bisección en `utils/creditos`: prestado = cuota × (1 − (1+i)^−n) / i; incluye seguros u otros cobros dentro de la cuota), la tabla de amortización (sistema francés), los intereses pagados y por pagar, el saldo de capital y la fecha en que termina. **Regla de la sección: una sola cosa llama la atención por pantalla, y es el botón de pago.** Todo lo demás es calmo: **tarjetas de vidrio** (`SuperficieVidrio`, el `Glass` de Konsta —Liquid Glass de iOS 26— de la barra de pestañas y los selectores) **sin fondo de color ni animado detrás** (el fondo vivo de la brecha es solo de Reportes), sin movimiento continuo, y el color vive solo en los datos (verde = lo que baja la deuda o las cuotas pagadas, coral `--intereses` = intereses; las palabras acompañan siempre al color). **Orden:** primero los créditos, después —solo si hay dos o más— "Todos tus créditos juntos" (`ResumenInteresesCreditos`: cuánto falta, intereses por pagar y la barra de lo pagado). **Tarjeta por crédito** (`TarjetaCredito`): emoji según el nombre, nombre · entidad, dos bandas de **segmentos** (nada de frases): *Próxima* **Diciembre** · *Faltan* **14 cuotas** · *Termina* **Ene 2028** (si se pasó, el primero pasa a *Atrasada* **Octubre** en coral) e *Intereses pagados* · *Falta pagar*; **sin el día exacto** (cada banco cuenta el corte a su manera). Los segmentos salen de `segmentosCredito`, "**11** de 24" en 40px (lo más grande), cuota por mes, un botón discreto **"Ver detalle ›"** arriba a la derecha (la tarjeta ya no es toda un botón), la **tira de cuotas** (`TiraCuotas`: una rayita por cuota; pagadas en verde, la que toca en azul —coral si está atrasada—, el resto apagado; entra en cascada una sola vez con transform/opacity; con más de 60 cuotas es una barra), y el botón. **Solo el botón de la cuota más urgente lleva los efectos de React Bits** (`BotonPrincipal`, sobre `StarBorder` + `ShinyText`, los del botón flotante, en el chunk `lazy` de `BotonPrincipalEfectos`); los demás botones de las otras tarjetas son iguales pero quietos, y el botón flotante de esta vista va sin luz (`BotonFlotante efectos={false}`). **Detalle:** tarjeta neutra con la misma tira y "11 de 24" en 48px; "Cómo se reparte tu plata" (dos `BarraReparto`: lo que ya pagaste —"Bajó tu deuda / Fue en intereses"— y lo que te falta —"Aún debes / En intereses"—); "Lo que cuesta este crédito" (por cada $1.000 prestados pagas $1.292 en 40px, lo prestado, el total, los intereses totales destacados, tasa mensual y efectiva anual); botón "Ver las N cuotas, una por una" (tabla por mes, "Cuota 4 · noviembre de 2026", con las pagadas en ✓); pagos registrados con papelera; Editar y Eliminar; el botón principal anclado abajo con efectos (es el único de la hoja). **Cada pago de cuota es un egreso** enlazado al crédito (`transacciones.credito_id`): baja el Disponible, cuenta como gasto de deuda y como gasto fijo, y en la dona de Reportes sale como "Cuota de crédito"; tocarlo en el Historial abre su crédito. Las cifras del contrato no se editan. Alta por pasos con la misma transición push: ¿Qué crédito pagas? (atajos Moto, Carro, Vivienda…) → las cifras (con el costo calculado en vivo y un aviso si las cuotas no suman lo prestado) → ¿En qué cuota vas?. La insignia de la pestaña suma los préstamos vencidos y las cuotas atrasadas. Las tablas van en `supabase/schema.sql` (correr la migración antes de publicar) |
| `LineaApartes` | Línea de apoyo bajo el Disponible (Resumen) y el balance (Reportes): "Separaste $X para ahorro · Prestaste $X · Te devolvieron $X". Explica lo que movió el Disponible sin ser gasto ni ingreso |
| `GastosAnualesSheet` / `EditarGastoAnualSheet` | Gastos que llegan una vez al año, desde Perfil → Tus datos. Arriba una frase con lo que cuestan al mes (no una cifra protagonista); lista con mes de vencimiento y cuota mensual; sugerencias en `ChipOpcion` sin monto; la edición lleva `CampoMonto` en la cabecera, el mes en chips y la categoría opcional en `SelectorCategoria`. La lógica vive en `useGastosAnuales` |
| `CampoPortada` (solo login y registro) | Cada campo es su propia tarjeta de 64px (radio 20, sombra suave en claro, borde tenue en oscuro) con ícono en círculo, etiqueta de 12px arriba y el texto de 17px. Al enfocar: aro azul de acento (capa aparte que solo cambia opacidad) e ícono en azul. Toda la tarjeta es el `<label>`. Los formularios de dentro de la app siguen con `CampoTexto` en filas de lista iOS |
| Brecha histórica (`BrechaHistorica`, lo primero de Reportes) | Lo principal de la pestaña: todo el historial del usuario, sin depender del mes elegido; el resto queda bajo "Mes a mes". **Tarjeta de vidrio oscura en claro y en oscuro** (excepción a la regla de neutros, por pedido del usuario a partir de una referencia): fondo vivo que se mueve despacio (`FondoVidrio`: `Aurora` de React Bits en azul pizarra `#4a6bb5`, verde `#1f9d6c` y verde profundo `#14452f` sobre `#0a1522`; sin WebGL2 queda un degradado quieto) y, encima, todo en blanco; la sección lleva la clase `dark` para que el `Glass` de Konsta use su vidrio oscuro (en tema claro se vuelve blanco y el texto no se lee). De arriba abajo: la frase de Morgan Housel centrada como título (26px, `GradientText`, autor con `ShinyText`); `BlockHeader` de Konsta "Te ha quedado / Te ha faltado" y la brecha en grande (`MontoAnimado`, menta `#4ee0a8` o coral `#ff8c99`); dos fichas `BorderGlow` (Entró con flecha arriba y +, Salió con flecha abajo y −; al tocar la gráfica muestran ese mes); y el panel `Glass` con la gráfica. **Paleta tomada de la referencia:** menta `#31d494` para Ingresos y coral `#ff7080` para Gastos. **Gráfica (Recharts, 288px, solo carga con Reportes):** título "Ingresos vs. gastos" con leyenda en píldoras (línea + nombre), líneas de 4px con puntas redondas, la de ingresos con brillo y relleno degradado, ejes en L con "Dinero" y "Tiempo" (sin números ni cuadrícula) y una **flecha doble sobre la mayor brecha** con una etiqueta blanca ("Tu ahorro" / "Lo que faltó") encima; con el dedo la flecha sigue al mes tocado y aparece "Hasta {mes} · quedaron / faltaron $X". Se dibuja al entrar; con "reducir movimiento" aparece ya dibujada. El rojo del gasto es excepción documentada: el signo − y la flecha acompañan al color. Cálculo en `utils/historialAcumulado`
| Anillo del avatar (`CabeceraPerfil`) | `StarBorder` de React Bits alrededor del avatar del Perfil (96px + 4px de aire, radio 52 = círculo): una estrella de luz da la vuelta cada 6 s con los verdes azulados del logo (en claro `#138a77`, en oscuro `#7ee0c4`, rastro `#43af9c`) sobre un anillo tenue del mismo verde. Sin reacción a hover; al tocar el avatar sale un pulso por el anillo. Con "reducir movimiento" la estrella queda quieta. Es identidad de marca, no logro: no usa el naranja de `--logro` |
| Portada del login (`PortadaLogin`, `auth/Login`) | La única pantalla de la app donde se permite el despliegue de efectos (es la portada, no una pantalla de trabajo). Todo con React Bits y en un chunk aparte que solo descarga quien ve el login. **Móvil:** `Aurora` de fondo con los verdes azulados del logo (`#16687c`, `#43af9c`, `#1f8a8c`; `lightMode` en claro, `dpr` 1), desvanecida antes del formulario; logo con anillo `StarBorder` (radio 22); título con `SplitText` letra por letra; lema que se escribe solo con `TextType` ("Cuadra tus gastos / ingresos / préstamos / ahorros"); chispas `ClickSpark` al tocar el botón principal. La cita de Morgan Housel acompaña al slogan: en móvil va bajo el formulario y en escritorio dentro de la vitrina. **Escritorio (≥1024px):** dos columnas; a la izquierda la vitrina (`VitrinaProducto`): panel `#0a2a31` con `Aurora`, el nombre con `ShinyText`, "Tus cuentas, cuadradas." con `SplitText` y una tarjeta de muestra del Disponible con `Counter` (cambia cada 3.4 s) y destello `GlareHover` en bucle; la aurora del fondo no se monta (una sola a la vez). Sin WebGL2, o si el contexto se pierde, queda un degradado CSS quieto. Con "reducir movimiento" todo queda quieto y el lema muestra la frase completa al lector de pantalla. Si el chunk no carga, quedan logo, título y lema planos y el formulario funciona igual |
| Página de mudanza (`mudanza/index.html`, fuera de la app) | HTML estático del link viejo de GitHub Pages, sin Konsta ni Tailwind: copia a mano los tokens de este documento (fondo agrupado, tarjeta, secundario, azul del sistema, radio 26px, botón píldora de 50px). En el navegador redirige sin mostrarse; en la app instalada muestra ícono, "Mi Cuadre se mudó", la dirección nueva con "Copiar", cuatro pasos numerados según iPhone o Android y "Abrir Mi Cuadre" abajo. Debe caber en 390×844 sin scroll y la dirección en una línea desde 320px. Si cambian los tokens de la app, actualizarla a mano |

## Movimiento

- Transiciones de Konsta para hojas, alertas y pestañas (no se reemplazan).
- **Flujo por pasos** (`PasosDeslizantes`, "Nuevo movimiento"): transición *push* de iOS. El paso que entra llega desde la derecha y el que sale se retira un 28 % a la izquierda y se desvanece; al volver atrás, al revés. 380 ms con `cubic-bezier(0.32, 0.72, 0, 1)` (la curva de la navegación de iOS) y 260 ms de opacidad; las barras de progreso se llenan con `scaleX` y la misma curva. Solo `transform` y `opacity`. Los pasos quedan montados (no se pierde lo escrito) pero los inactivos van `inert` y ocultos.
- Gráficos: crecen una vez al montar (700 ms, ease-out exponencial). Al cambiar de mes se reinician.
- Contenido de pantalla: aparece con `aparecer-suave` (400 ms, `opacity` + `transform`).
- Montos protagonistas (Disponible, "Te deben", saldo del préstamo, balance de Reportes): `MontoAnimado`, sobre el `Counter` de React Bits (`components/reactbits/`). Los dígitos ruedan al cambiar (mes, movimiento, abono), con resorte de 0.7 s y desvanecido corto (0.15em) para no invadir el rótulo de arriba. Sin desenfoque de movimiento. Solo Reportes gira al entrar (`intro`); donde el monto se mira a diario solo se anima al cambiar. El lector de pantalla oye el monto completo. Los montos chicos (listas, chips) no se animan.
- Celebraciones con `ClickSpark` de React Bits en modo `manual`: nunca en cada toque, solo en logros. Préstamo saldado: líneas verdes del ingreso detrás del saldo, cuando baja la hoja del abono. Hito nuevo de antigüedad: estrellas en los tonos de `--logro` desde la medalla, una sola vez por hito (se recuerda en `localStorage`, `mi-cuadre:hito-celebrado`). El canvas no lee variables CSS: los colores van en hex.
- `prefers-reduced-motion`: todas las animaciones y transiciones se reducen a ~0.

### Rendimiento (pensado para teléfonos viejos)

- **Datos con copia local** (`data/cacheLocal`, en `FinanzasContext`): lo último que se vio se guarda en el teléfono (por usuario, con versión). Al abrir la app se muestra al instante y se actualiza por detrás, sin spinner. Una copia de menos de 2 minutos no se vuelve a pedir; al volver a la app tras ~5 minutos se actualiza sola. Los cambios (crear, editar, borrar) actualizan la copia con una pausa de 0,8 s. Cerrar sesión la borra (no al ver "sin sesión": al abrir, la sesión tarda un instante en recuperarse). Si el almacenamiento falla, la app sigue pidiendo todo cada vez. La primera página de movimientos pide el total para no hacer una consulta de más.
- **Lo importante primero:** `useMontajeDiferido` pinta ya el título, el monto y las fichas, y monta un par de cuadros después lo pesado (fondo WebGL, gráfica y las tarjetas de más abajo de Reportes). Quien lo usa reserva el alto para que nada salte.
- **Fondo animado barato** (`FondoVidrio`): se dibuja a 0,6 de resolución, 30 cuadros por segundo y 2 capas (el tope `maxFps` se agregó a Aurora). Mide su fluidez al arrancar y, bajo 40 fps, se queda quieto con un degradado; también se queda quieto sin WebGL2, con ahorro de datos y con "reducir movimiento". Sin `blur` CSS sobre el canvas.
- **Efectos sin bucle de JavaScript:** el título de la brecha usa un degradado CSS fijo y el autor va en texto plano; el brillo de la curva es una línea más ancha y translúcida (no un filtro SVG de desenfoque). Las curvas se animan solo la primera vez por sesión.
- **Cálculos guardados:** el historial acumulado se guarda por lista de movimientos (`historialEnCache`) y la tarjeta es `memo`: volver a Reportes o cambiar de mes no la recalcula ni la redibuja.
- **Código a tiempo:** Reportes (la pestaña más pesada, con Recharts) se descarga en segundo plano cuando la app está en reposo, salvo con ahorro de datos.

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
