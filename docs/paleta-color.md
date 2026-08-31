# Paleta de color — Saldo (app de finanzas)

Implementa el sistema de color de la app siguiendo esta guía. Es un lenguaje visual estilo Apple (Human Interface Guidelines): superficies neutras, tipografía del sistema y dos colores semánticos —verde y rojo— reservados exclusivamente para dinero. Todo el sistema debe funcionar en modo claro y modo oscuro desde el día uno, no como un ajuste posterior.

## Regla de oro

El verde y el rojo **solo** se usan para ingresos y gastos. Ningún otro elemento de la interfaz (botones, links, iconos de navegación) puede tomar prestado ese color, o el usuario perderá la asociación "verde = entra dinero, rojo = sale dinero". El acento de marca (índigo) es un color aparte y nunca debe usarse para representar un monto.

Además, el color nunca es el único indicador de un valor: todo monto debe ir siempre acompañado del signo (+ / −), no solo del tinte. Es un requisito de accesibilidad, no un detalle estético.

## Tokens de color

Formato: `nombre` — claro / oscuro — uso.

**Marca**
- `brand` — `#5856D6` / `#7D7AFF` — botones primarios, tabs activos, foco de inputs
- `brandTint` — `#EDEDFC` / `rgba(125,122,255,0.16)` — fondos de selección, chips activos
- `info` — `#007AFF` / `#0A84FF` — enlaces, banners informativos (distinto de `brand` a propósito)

**Semántico — dinero**
- `income` — `#34C759` / `#30D158` — montos positivos, insignias "recibido", flechas arriba
- `incomeTint` — `rgba(52,199,89,0.12)` / `rgba(48,209,88,0.16)` — fondo de píldoras "Ingreso", área de gráficas
- `expense` — `#FF3B30` / `#FF453A` — montos negativos, insignias "pagado", acciones destructivas
- `expenseTint` — `rgba(255,59,48,0.12)` / `rgba(255,69,58,0.16)` — fondo de píldoras "Gasto", alertas de saldo bajo
- `warning` — `#FF9500` / `#FF9F0A` — transacciones pendientes, avisos de presupuesto (ni ingreso ni gasto todavía)
- `warningTint` — `rgba(255,149,0,0.12)` / `rgba(255,159,10,0.16)` — fondo de banda de alerta

**Neutros / superficies**
- `bg` — `#F2F2F7` / `#000000` — fondo base de toda la app
- `surface` — `#FFFFFF` / `#1C1C1E` — tarjetas, filas de lista, hojas modales
- `surfaceElevated` — `#FFFFFF` (con sombra) / `#2C2C2E` — popovers, tooltips
- `surfaceTertiary` — `#E5E5EA` / `#2C2C2E` — segmented control, inputs deshabilitados
- `separator` — `rgba(60,60,67,0.29)` / `rgba(84,84,88,0.65)` — líneas divisorias

**Texto**
- `label` — `#1C1C1E` / `#FFFFFF` — montos, títulos, nombres de comercio
- `labelSecondary` — `#6E6E73` / `#98989D` — categorías, fechas, subtítulos
- `labelTertiary` — `#AEAEB2` / `#636366` — placeholders, texto deshabilitado

## Tipografía y forma (contexto, no negociable con la paleta)

Fuente del sistema (SF Pro vía `-apple-system` / `San Francisco` nativo en iOS). Esquinas redondeadas generosas (≈18–22px en tarjetas) para el efecto "squircle" de Apple. Los montos numéricos van en fuente monoespaciada o con `tabular-nums` activado, para que las cifras alineen en columna en las listas.

## Implementación — SwiftUI

```swift
extension Color {
    // Marca
    static let brand = Color("Brand") // #5856D6 / #7D7AFF
    static let brandTint = Color("BrandTint")
    static let info = Color("Info") // #007AFF / #0A84FF

    // Semántico
    static let income = Color("Income") // #34C759 / #30D158
    static let incomeTint = Color("IncomeTint")
    static let expense = Color("Expense") // #FF3B30 / #FF453A
    static let expenseTint = Color("ExpenseTint")
    static let warning = Color("Warning") // #FF9500 / #FF9F0A
    static let warningTint = Color("WarningTint")

    // Neutros
    static let appBackground = Color("Background")
    static let surface = Color("Surface")
    static let surfaceElevated = Color("SurfaceElevated")
    static let separator = Color("Separator")

    // Texto
    static let label = Color("Label")
    static let labelSecondary = Color("LabelSecondary")
    static let labelTertiary = Color("LabelTertiary")
}
```

Crea cada nombre (`Brand`, `Income`, etc.) como Color Set en el catálogo de Assets, con Appearance = "Any, Dark" para que el sistema resuelva claro/oscuro automáticamente sin lógica condicional en el código.

## Implementación — CSS / web

```css
:root {
  --brand: #5856D6;
  --brand-tint: #EDEDFC;
  --info: #007AFF;
  --income: #34C759;
  --income-tint: rgba(52,199,89,.12);
  --expense: #FF3B30;
  --expense-tint: rgba(255,59,48,.12);
  --warning: #FF9500;
  --warning-tint: rgba(255,149,0,.12);
  --bg: #F2F2F7;
  --surface: #FFFFFF;
  --surface-elevated: #FFFFFF;
  --surface-tertiary: #E5E5EA;
  --separator: rgba(60,60,67,.29);
  --label: #1C1C1E;
  --label-secondary: #6E6E73;
  --label-tertiary: #AEAEB2;
}

@media (prefers-color-scheme: dark) {
  :root {
    --brand: #7D7AFF;
    --brand-tint: rgba(125,122,255,.16);
    --info: #0A84FF;
    --income: #30D158;
    --income-tint: rgba(48,209,88,.16);
    --expense: #FF453A;
    --expense-tint: rgba(255,69,58,.16);
    --warning: #FF9F0A;
    --warning-tint: rgba(255,159,10,.16);
    --bg: #000000;
    --surface: #1C1C1E;
    --surface-elevated: #2C2C2E;
    --surface-tertiary: #2C2C2E;
    --separator: rgba(84,84,88,.65);
    --label: #FFFFFF;
    --label-secondary: #98989D;
    --label-tertiary: #636366;
  }
}
```

## Checklist de aceptación

- [ ] Ningún monto se muestra solo por color; siempre lleva el signo `+`/`−`.
- [ ] `brand` no aparece en ningún componente que represente dinero.
- [ ] Los tints (`incomeTint`, `expenseTint`, `warningTint`) se usan únicamente como fondo, nunca como texto sobre fondo claro sin verificar contraste.
- [ ] La app cambia de claro a oscuro sin flashes de color incorrecto (colores definidos como Color Set / media query, no hardcodeados en cada vista).
- [ ] Contraste texto/fondo verificado en ambos modos (mínimo WCAG AA, 4.5:1 para texto normal).
