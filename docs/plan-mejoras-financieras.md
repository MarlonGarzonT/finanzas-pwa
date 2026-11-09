# Plan de mejoras financieras

Backlog priorizado a partir de la revisión financiera de la app (noviembre 2026).
Cada tarea indica qué hacer, en qué archivos, qué reglas de negocio cumplir y cómo
saber que quedó bien. El orden de las fases respeta las dependencias: no adelantes
una tarea si su bloqueante no está en `main`.

> Grupos se retiró de la interfaz en el commit `36769e3`. Las tablas `grupo_*`
> siguen en `supabase/schema.sql`, pero este plan no las toca.

---

## Convenciones para todas las tareas

**Dónde va cada cosa** (estructura actual del repo):

| Qué | Dónde |
|---|---|
| Tipos compartidos | `src/types.ts` |
| Acceso a Supabase (select/insert/update) | `src/db.ts` |
| Estado global de datos | `src/data/FinanzasContext.tsx` |
| Hooks de datos derivados | `src/data/use*.ts` |
| Cálculos puros (sin React, sin Supabase) | `src/utils/*.ts` |
| Componentes | `src/components/*.tsx` |
| Pantallas | `src/pages/*.tsx` |
| Esquema y migraciones | `supabase/schema.sql` (bloques nuevos al final, idempotentes, con comentario `-- Migración: ...`, se corren a mano en el SQL Editor) |

**Reglas:**

- Los cálculos financieros van en funciones puras dentro de `src/utils/`, con la
  fecha de hoy como parámetro opcional (`hoy: Date = new Date()`) para poder probarlos.
- Las claves de mes siempre salen de `claveMes` o `claveMesDeFecha` (`src/utils/fechas.ts`),
  que usan la hora local. Nunca uses `fecha.slice(0, 7)`, porque eso es UTC.
- Toda tabla nueva lleva `user_id ... default auth.uid()`, RLS activo y la política
  `for all using (auth.uid() = user_id) with check (auth.uid() = user_id)`, igual que
  `categorias` y `transacciones`.
- **Clientes viejos:** el service worker usa `registerType: 'prompt'`, así que habrá
  teléfonos con la versión anterior después de un deploy. Ninguna migración puede
  romper los inserts o updates de la versión anterior (usa defaults o triggers;
  ver B1).
- Todo cambio de UI sigue `DESIGN.md` y la ley de skills de `CLAUDE.md`
  (taste-skill, impeccable, ui-ux-pro-max).
- Antes de abrir el PR: `npm run build` y `npm run lint` sin errores, y el flujo
  probado en un viewport de 360–430 px.
- Una rama por tarea (`feature/...` o `fix/...`), con commits en español y en imperativo.

**Montos de los ejemplos:** son casos de prueba. Úsalos tal cual para verificar.

---

## Fase 0: críticos

La app hoy muestra números falsos. Ninguna de estas tareas tiene dependencias y
pueden ir en un solo PR o en varios.

### C0 (recomendado): pruebas para los cálculos

- **Qué:** agregar Vitest como devDependency (corre pruebas de funciones puras, no
  pesa en el bundle) y un script `"test": "vitest run"`.
- **Dónde:** `package.json` y `src/utils/estadisticasMes.test.ts`.
- **Aceptación:** los casos de C1 y C2 quedan escritos como pruebas y pasan.

### C1: comparación con el mes anterior a igual fecha

- **Problema:** en el mes en curso compara lo gastado *hasta hoy* con el mes anterior
  *completo*. El día 9 casi siempre dice "X% menos gasto". Además, agrupa por mes con
  `t.fecha.slice(0, 7)` (UTC), distinto al resto de la app.
- **Dónde:**
  - `src/utils/estadisticasMes.ts`: `compararConMesAnterior`.
  - `src/pages/Reportes.tsx`: la llamada.
  - `src/components/ComparacionMes.tsx`: el texto.
- **Qué hacer:**
  1. Cambiar la firma a
     `compararConMesAnterior(transacciones, mesSeleccionado, categoriaPorId, hoy = new Date())`.
  2. Reemplazar `t.fecha.slice(0, 7)` por `claveMes(t.fecha)`.
  3. Sumar solo los egresos de categorías con `esFijo === false`. Los fijos caen en
     días puntuales y meten ruido. Una categoría borrada cuenta como variable.
  4. Si `mesSeleccionado` es el mes actual, el corte es `hoy.getDate()`:
     - Este mes suma los días `1..corte`.
     - El mes anterior suma los días `1..min(corte, díasDelMesAnterior)`.
  5. Si es un mes pasado, se compara mes completo contra mes completo.
  6. Devolver `null` en dos casos:
     - El total anterior es ≤ 0.
     - El primer movimiento del usuario es posterior al día 1 del mes anterior
       (ese mes está incompleto).
  7. Agregar al resultado el día de corte y nombrar el periodo en el texto, por
     ejemplo "Frente a octubre, a la misma fecha".
- **Aceptación:**
  - Hoy es 9-nov. Variables de octubre: 700.000 entre el 1 y el 9, 2.400.000 en todo
    el mes. Variables de noviembre del 1 al 9: 900.000. **Resultado: +28,6% (más gasto).**
  - Un gasto del 31-oct a las 21:00 (hora de Colombia) cuenta en octubre.
  - El primer movimiento es del 15-oct y se mira noviembre: no se muestra la comparación.

### C2: proyección de fin de mes sin extrapolar los fijos

- **Problema:** `gasto total ÷ días transcurridos × días del mes` multiplica el arriendo.
  El día 3, con 1.200.000 de arriendo y 60.000 de mercado, proyecta 12.600.000.
- **Dónde:**
  - `src/utils/estadisticasMes.ts`: `proyeccionFinDeMes`.
  - `src/pages/Reportes.tsx`: la línea `const proyeccion = ...`.
- **Qué hacer:**
  1. Nueva firma:
     `proyeccionFinDeMes(transaccionesDelMes, categoriaPorId, mesSeleccionado, hoy = new Date()): number | null`.
  2. Cálculo: `fijos + (variables / hoy.getDate()) × díasDelMes`, donde:
     - `fijos` = egresos del mes de categorías `esFijo`, sin extrapolar.
     - `variables` = el resto de egresos.
  3. Devolver `null` si no es el mes actual o si `hoy.getDate() < 7`.
  4. En la Fase 2 (B3) se suman además los recurrentes pendientes. Deja un comentario
     que lo explique.
- **Aceptación:**
  - El día 3 devuelve `null`.
  - Día 10 de noviembre, con un fijo de 1.200.000 y variables de 500.000:
    **2.700.000**.

### C3: quitar la "semana del mes"

- **Problema:**
  - La semana 5 tiene de 1 a 3 días y la semana 1 carga los fijos, así que el
    gráfico refleja el calendario y no el gasto.
  - Los movimientos asignados a otro mes reciben el día de hoy
    (`fechaEnMesSeleccionado`), así que su semana es inventada.
- **Dónde y qué:**
  1. `src/pages/Reportes.tsx`: quitar el bloque "Gasto por semana", el `useMemo` de
     `semanal` y sus imports.
  2. Borrar `src/components/GraficoSemanal.tsx` y `gastoPorSemana` de `src/utils/estadisticasMes.ts`.
  3. `src/pages/Historial.tsx` (línea ~242): quitar `· Sem. ${t.semanaDelMes}` del detalle.
  4. `src/utils/exportarExcel.ts` (línea ~305): quitar la columna `semana`.
  5. `src/types.ts`: quitar `semanaDelMes` de `Transaccion`.
  6. `src/db.ts`: quitar `semana_del_mes` de los `select` y del mapper, pero **seguir
     escribiéndolo** en insert y update en este PR, por los clientes viejos.
  7. Al final de `supabase/schema.sql`:
     ```sql
     -- Migración: semana_del_mes deja de usarse. Opcional para versiones viejas.
     alter table transacciones alter column semana_del_mes drop not null;
     ```
     En un PR posterior, cuando ya no queden clientes viejos, se deja de escribir y
     se borra `calcularSemanaDelMes`.
- **Aceptación:**
  - Ninguna pantalla ni el Excel muestran la semana.
  - `npm run build` pasa sin referencias huérfanas.

### C4: no pintar "más gasto" como alerta

- **Problema:** gastar más que el mes pasado no siempre es malo (SOAT, matrícula), y
  el color de alerta castiga a quien planeó.
- **Dónde:** `src/components/ComparacionMes.tsx`, la clase
  `sube ? 'text-alerta' : 'text-ingreso'`.
- **Qué hacer:**
  - Usar color neutro en ambos sentidos. La flecha y el texto "más" o "menos" ya
    comunican la dirección.
  - En `BalanceMes.tsx`, "Te pasaste" se mantiene: gastar más de lo que entró sí es
    una alerta real.
- **Aceptación:** con +28% de gasto, la cifra no se ve en rojo y el texto sigue
  diciendo "más gasto".

---

## Fase 1: bloqueantes de base

B1 → B2 en orden. A4 puede ir en paralelo.

### B1: naturaleza de la categoría

- **Problema:** la app no sabe qué es ahorro, deuda, pago de tarjeta o gasto
  necesario, así que no puede calcular ninguna métrica financiera.
- **Modelo:** el `tipo` (ingreso o egreso) se mantiene y se agrega `naturaleza`:

  | tipo | naturaleza | Significado | Ejemplos |
  |---|---|---|---|
  | egreso | `esencial` | Gasto necesario | Vivienda, servicios, mercado, transporte, salud |
  | egreso | `discrecional` | Gasto prescindible | Salidas, domicilios, ropa, suscripciones |
  | egreso | `deuda` | Cuota de un crédito | Moto, libranza, crédito de vivienda |
  | egreso | `ahorro` | Plata que se separa | Ahorro, bolsillo, CDT, pensión voluntaria |
  | egreso | `pago_tarjeta` | Pago de la tarjeta de crédito (las compras ya se registraron como gasto) | Pago tarjeta |
  | ingreso | `ordinario` | Ingreso habitual | Salario, honorarios, ventas |
  | ingreso | `extraordinario` | Ingreso que no se repite | Prima, bonos, intereses de cesantías, venta de algo |
  | ingreso | `prestamo_reembolso` | Entra plata que no es ingreso | Préstamo recibido, alguien te devuelve plata |

  `es_fijo` se mantiene: indica "se repite cada mes" y es independiente de la naturaleza.

- **Migración** (al final de `supabase/schema.sql`):
  ```sql
  -- Migración: naturaleza de la categoría (cómo cuenta cada movimiento en las
  -- métricas). Segura de repetir.
  alter table categorias add column if not exists naturaleza text;

  -- Esencial por defecto: si no sabemos, es más prudente sobrestimar el gasto
  -- necesario (el colchón se calcula sobre él) que subestimarlo.
  update categorias set naturaleza = case
    when tipo = 'ingreso' and (nombre ilike '%prima%' or nombre ilike '%bono%'
      or nombre ilike '%bonifica%' or nombre ilike '%cesant%') then 'extraordinario'
    when tipo = 'ingreso' and (nombre ilike '%prestamo%' or nombre ilike '%préstamo%'
      or nombre ilike '%reembolso%' or nombre ilike '%devoluci%') then 'prestamo_reembolso'
    when tipo = 'ingreso' then 'ordinario'
    when nombre ilike '%ahorro%' then 'ahorro'
    when nombre ilike '%tarjeta%' then 'pago_tarjeta'
    when nombre ilike '%cuota%' or nombre ilike '%credito%' or nombre ilike '%crédito%'
      or nombre ilike '%deuda%' then 'deuda'
    when nombre ilike '%entreten%' or nombre ilike '%salida%' or nombre ilike '%domicilio%' then 'discrecional'
    else 'esencial'
  end
  where naturaleza is null;

  -- Los clientes con la versión anterior crean y editan categorías sin
  -- naturaleza: el trigger la completa o la corrige si cambian el tipo.
  create or replace function categorias_naturaleza_defecto()
  returns trigger language plpgsql as $$
  begin
    if new.naturaleza is null
      or (new.tipo = 'ingreso' and new.naturaleza not in ('ordinario','extraordinario','prestamo_reembolso'))
      or (new.tipo = 'egreso' and new.naturaleza not in ('esencial','discrecional','deuda','ahorro','pago_tarjeta')) then
      new.naturaleza := case when new.tipo = 'ingreso' then 'ordinario' else 'esencial' end;
    end if;
    return new;
  end;
  $$;

  drop trigger if exists categorias_naturaleza_defecto on categorias;
  create trigger categorias_naturaleza_defecto
    before insert or update on categorias
    for each row execute function categorias_naturaleza_defecto();

  alter table categorias alter column naturaleza set not null;
  alter table categorias drop constraint if exists categorias_naturaleza_check;
  alter table categorias add constraint categorias_naturaleza_check check (
    (tipo = 'egreso' and naturaleza in ('esencial','discrecional','deuda','ahorro','pago_tarjeta'))
    or (tipo = 'ingreso' and naturaleza in ('ordinario','extraordinario','prestamo_reembolso'))
  );
  ```
- **Código:**
  1. **`src/types.ts`:** agregar
     `type NaturalezaEgreso`, `type NaturalezaIngreso` y `type Naturaleza = NaturalezaEgreso | NaturalezaIngreso`.
     Sumar `naturaleza` a `Categoria` y a `CambiosCategoria`.
  2. **`src/utils/naturalezaCategoria.ts` (nuevo):**
     `sugerirNaturaleza(nombre: string, tipo: Tipo): Naturaleza`, con las mismas reglas
     del `case` SQL. Sigue el patrón de `src/utils/emojiCategoria.ts`.
     Agregar también `naturalezasPorTipo(tipo)` y `etiquetaNaturaleza(n)` para la UI.
     Textos sugeridos: Necesario, Prescindible, Cuota de un crédito, Ahorro,
     Pago de tarjeta, Ingreso habitual, Ingreso extra, Préstamo o devolución.
  3. **`src/db.ts`:**
     - Agregar `naturaleza` a `COLUMNAS_CATEGORIA` y a `mapCategoria`.
     - `crearCategoria` envía `naturaleza: sugerirNaturaleza(nombre, tipo)`.
     - `actualizarCategoria` envía `naturaleza` si viene en los cambios.
     - Agregar `naturaleza` a cada elemento de `CATEGORIAS_DEFECTO`.
  4. **`src/components/EditarCategoriaSheet.tsx`:**
     - Agregar un selector de naturaleza con las opciones de
       `naturalezasPorTipo(tipo)`.
     - Al cambiar el tipo, se resetea a `sugerirNaturaleza(nombre, nuevoTipo)`.
     - El toggle "Gasto fijo mensual" solo aparece si la naturaleza es esencial,
       discrecional o deuda.
  5. **`NuevaCategoriaSheet.tsx`** y la creación rápida desde **`NuevoMovimientoSheet.tsx`:**
     no se agrega ningún paso. Se usa la sugerencia en silencio para que crear una
     categoría siga siendo rápido.
  6. **`src/components/GestionCategorias.tsx`:** mostrar la etiqueta de naturaleza en
     cada fila (junto o en lugar del indicador de fijo).
- **Aceptación:**
  - Después de la migración, ninguna categoría tiene `naturaleza` nula.
  - Una categoría creada desde la versión vieja del cliente queda con `esencial`
    u `ordinario`.
  - Al cambiar una categoría de egreso a ingreso, no hay error de constraint y la
    naturaleza pasa a una válida.
  - Registrar un gasto con categoría nueva toma los mismos toques que antes.

### B2: contabilidad por naturaleza

Depende de B1. Esta tarea **también es crítica**: hoy el ahorro sube el gasto y el
pago de la tarjeta se cuenta dos veces.

- **Reglas de negocio:**

  | naturaleza | ¿Cuenta como gasto? | ¿Cuenta como ingreso? | Nota |
  |---|---|---|---|
  | esencial, discrecional, deuda | Sí | — | |
  | ahorro | No | — | Se suma aparte en `ahorro` |
  | pago_tarjeta | No | — | Las compras con tarjeta ya se registraron como gasto |
  | ordinario | — | Sí | |
  | extraordinario | — | Sí | Se reporta aparte en `ingresosExtraordinarios` |
  | prestamo_reembolso | — | No | |
  | sin categoría (borrada) | Sí, como esencial | Sí, como ordinario | Según el `tipo` |

  **Disponible del mes** = ingresos (ordinarios + extraordinarios) − gastos − ahorro.

- **Código:**
  1. **`src/utils/contabilidad.ts` (nuevo, funciones puras):**
     - `clasificar(t: Transaccion, categoria?: Categoria)` devuelve:
       `'gasto_esencial' | 'gasto_discrecional' | 'gasto_deuda' | 'ahorro' | 'pago_tarjeta' | 'ingreso_ordinario' | 'ingreso_extraordinario' | 'prestamo_reembolso'`.
     - `resumirMes(transacciones, categoriaPorId)` devuelve un `ResumenContable`:
       `{ ingresosOrdinarios, ingresosExtraordinarios, ingresos, gastosEsenciales, gastosDiscrecionales, cuotasDeuda, gastos, ahorro, pagosTarjeta, prestamosReembolsos, disponible }`.
  2. **`src/data/useResumenMes.ts` (nuevo):** recibe `mesSeleccionado` y devuelve
     `{ transaccionesDelMes, categoriaPorId, resumen }`. Hoy `Resumen.tsx` y
     `Reportes.tsx` duplican `categoriaPorId` y el filtro por mes; los dos pasan a
     usar este hook.
  3. **Reemplazar cada suma por `t.tipo`:**
     - `src/pages/Resumen.tsx`:
       - El `useMemo` de `totalIngresos`/`totalEgresos` se reemplaza por `resumen`.
       - `datosGrafico` ("En qué se fue") excluye ahorro y pago de tarjeta; "De dónde
         entró" excluye préstamos y reembolsos.
     - `src/components/BalanceCard.tsx`:
       - "Disponible" pasa a ser `resumen.disponible`.
       - Si `ahorro > 0`, agregar una línea "Separaste $X para ahorro".
     - `src/utils/estadisticasMes.ts`:
       - `desglosePorCategoria` excluye ahorro, pago de tarjeta y préstamos/reembolsos.
       - `fijoVsVariable`, `compararConMesAnterior` y `proyeccionFinDeMes` usan solo
         gastos.
       - `resumirMovimientos` calcula `proporcionGastada = gastos / ingresos`, con
         gastos sin ahorro y sin pago de tarjeta. Lo mejor es que use `resumirMes`
         por dentro.
       - `ingresosEgresosPorMes` excluye los movimientos que no son ingreso ni gasto.
     - `src/utils/exportarExcel.ts`:
       - Los totales usan `resumirMes`.
       - La hoja "Categorías" agrega la columna "Naturaleza".
       - El resumen agrega las filas Ahorro y Pagos de tarjeta.
  4. **Categorías de fábrica:**
     - Agregar a `CATEGORIAS_DEFECTO` (`src/db.ts`):
       - Ahorro 🐷 (egreso, ahorro).
       - Pago tarjeta 💳 (egreso, pago_tarjeta).
       - Préstamo o devolución 🤝 (ingreso, prestamo_reembolso).
       - Prima y extras 🎁 (ingreso, extraordinario).
       - Costos bancarios 🏦 (egreso, discrecional).
     - Sumar sus nombres a `src/utils/emojiCategoria.ts`.
     - Para los usuarios existentes:
       ```sql
       -- Migración: categorías de fábrica nuevas para usuarios que no tengan una
       -- de esa naturaleza. Segura de repetir.
       insert into categorias (user_id, nombre, emoji, tipo, naturaleza)
       select u.user_id, d.nombre, d.emoji, d.tipo, d.naturaleza
       from (select distinct user_id from categorias) u
       cross join (values
         ('Ahorro', '🐷', 'egreso', 'ahorro'),
         ('Pago tarjeta', '💳', 'egreso', 'pago_tarjeta'),
         ('Préstamo o devolución', '🤝', 'ingreso', 'prestamo_reembolso'),
         ('Prima y extras', '🎁', 'ingreso', 'extraordinario')
       ) as d(nombre, emoji, tipo, naturaleza)
       where not exists (
         select 1 from categorias c where c.user_id = u.user_id and c.naturaleza = d.naturaleza
       );
       ```
- **Aceptación:**
  - Salario de 2.500.000, ahorro de 500.000 y gastos de 1.600.000:
    disponible **400.000**, proporción gastada **64%**, estado "bien" (antes: 84%, "Ojo").
  - Préstamo recibido de 3.000.000: los ingresos del mes no cambian.
  - Compras con tarjeta de 800.000 en octubre y pago de tarjeta de 800.000 en
    noviembre: los gastos de noviembre no incluyen esos 800.000.
  - La dona de Reportes no muestra Ahorro ni Pago tarjeta.

### A4: gastos del año (en paralelo con B1 y B2)

- **Por qué ahora:** no bloquea nada, pero es noviembre. Si sale antes de diciembre y
  enero, ayuda justo en los meses de más golpe.
- **Migración:**
  ```sql
  -- Migración: gastos que llegan una vez al año (SOAT, predial, matrícula...).
  create table if not exists gastos_anuales (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
    nombre text not null,
    monto_estimado numeric not null check (monto_estimado > 0),
    mes_vencimiento int not null check (mes_vencimiento between 1 and 12),
    categoria_id uuid references categorias(id) on delete set null,
    activo boolean not null default true,
    created_at timestamptz default now()
  );
  alter table gastos_anuales enable row level security;
  drop policy if exists "usuario ve/edita solo sus gastos anuales" on gastos_anuales;
  create policy "usuario ve/edita solo sus gastos anuales" on gastos_anuales
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  ```
- **Código:**
  1. **`src/types.ts`:** `GastoAnual`.
  2. **`src/db.ts`:** `obtenerGastosAnuales`, `crearGastoAnual`, `actualizarGastoAnual`
     y `eliminarGastoAnual`.
  3. **`src/data/FinanzasContext.tsx`:** cargar `gastosAnuales` en `cargarTodo`
     junto con categorías y transacciones, y exponer su CRUD.
  4. **`src/utils/provisiones.ts` (nuevo):**
     - `mesesRestantes(mesVencimiento, hoy)` = `((mesVencimiento − mesActual + 12) % 12) + 1`.
       El mes actual cuenta, así que si vence este mes da 1.
     - `cuotaParaLlegar(g, hoy)` = `monto_estimado / mesesRestantes`.
     - `costoMensualEquivalente(lista)` = `Σ monto_estimado / 12`.
     - `pagadoEsteAño(g, transacciones, hoy)`: es `true` si existe un egreso con
       `categoriaId === g.categoria_id` en el mes de vencimiento del año en curso.
       Es estado derivado: no se guarda.
     - `provisionDelMes(lista, transacciones, hoy)` = suma de `cuotaParaLlegar` de los
       activos que aún no se han pagado este año.
  5. **UI:**
     - `src/components/GastosAnualesSheet.tsx`: lista con agregar, editar y borrar.
     - Sugerencias de un toque, **sin monto prellenado**: SOAT, Impuesto vehicular,
       Predial, Matrícula, Útiles escolares, Fiestas de diciembre, Seguro.
     - Se abre desde `src/pages/Perfil.tsx`, en la sección "Tus datos".
     - Arriba de la lista: "Tus gastos del año te cuestan $X al mes".
  6. **Comparaciones:** `compararConMesAnterior` excluye los egresos de categorías
     vinculadas a un gasto anual que caen en su mes de vencimiento.
- **Aceptación:**
  - Con SOAT (600.000, vence en marzo), predial (900.000, abril), matrícula
    (1.800.000, enero) y diciembre (1.500.000, diciembre), el costo mensual
    equivalente es **400.000**.
  - El 9-nov, la cuota para llegar al SOAT de marzo es 600.000 / 5 = **120.000**.
  - Pagar la matrícula en enero no sube la comparación de "más gasto".

---

## Fase 2: bloqueantes de uso y primeras métricas

### B3: movimientos recurrentes por confirmar

- **Regla clave:** un recurrente **nunca** se registra solo. Aparece como "por
  confirmar" y el usuario lo aprueba con un toque, con el monto editable. Si se
  registrara solo, el registro dejaría de reflejar la realidad.
- **Migración:**
  ```sql
  -- Migración: movimientos que se repiten cada mes (arriendo, servicios, cuotas).
  create table if not exists recurrentes (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
    item text not null,
    categoria_id uuid references categorias(id) on delete set null,
    tipo text not null check (tipo in ('ingreso', 'egreso')),
    monto numeric not null check (monto > 0),
    dia_del_mes int not null check (dia_del_mes between 1 and 31),
    activo boolean not null default true,
    created_at timestamptz default now()
  );
  alter table recurrentes enable row level security;
  drop policy if exists "usuario ve/edita solo sus recurrentes" on recurrentes;
  create policy "usuario ve/edita solo sus recurrentes" on recurrentes
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

  alter table transacciones add column if not exists recurrente_id uuid
    references recurrentes(id) on delete set null;
  ```
- **Código:**
  1. **`src/types.ts`:** `Recurrente`. Sumar `recurrenteId: string | null` a
     `Transaccion` y a `NuevaTransaccion` (opcional).
  2. **`src/db.ts`:**
     - CRUD de `recurrentes`.
     - `crearTransaccion` envía `recurrente_id`.
     - Los `select` de transacciones incluyen `recurrente_id`.
  3. **`src/data/FinanzasContext.tsx`:** cargar y exponer los `recurrentes`.
  4. **`src/utils/recurrentes.ts` (nuevo):**
     - `pendientesDelMes(recurrentes, transacciones, mes, hoy)` devuelve los activos
       que no tienen una transacción con su `recurrenteId` en ese mes.
     - `porConfirmar(...)` devuelve los pendientes con `dia_del_mes <= hoy + 3`.
     - Si el día es 31 y el mes tiene menos días, se usa el último día del mes.
  5. **UI:**
     - **`NuevoMovimientoSheet.tsx`:** un toggle "Se repite cada mes", apagado por
       defecto. Al guardar con el toggle encendido, se crea el recurrente (día = día
       de la fecha) y la transacción enlazada.
     - **`src/components/PorConfirmar.tsx`:** bloque en `src/pages/Resumen.tsx`,
       encima de los últimos movimientos y solo si hay pendientes. Cada fila tiene
       "Confirmar", que crea la transacción con `recurrenteId` y el monto editable,
       y "Este mes no", que no crea nada y lo oculta hasta el mes siguiente.
       "Este mes no" se guarda en `localStorage` con try/catch, porque es una
       comodidad del usuario y no un dato financiero.
     - **`src/components/GestionRecurrentes.tsx`:** se abre desde Perfil para editar
       y pausar.
  6. **Completar C2:** `proyeccionFinDeMes` suma los egresos con naturaleza de gasto
     de `pendientesDelMes`.
- **Aceptación:**
  - Un arriendo recurrente de 1.200.000 el día 1 aparece por confirmar desde el
    día 1 y desaparece al confirmarlo.
  - Si no se confirma, ningún total lo incluye, salvo la proyección.
  - Registrar un gasto sin tocar el toggle toma los mismos toques que antes.

### B4: cuadre mensual

Depende de B2.

- **Para qué:** la app supone que el usuario registró todo. El cuadre compara lo
  registrado con el dinero real y muestra lo que faltó registrar.
- **Preguntas al usuario** (solo dos):
  1. "¿Cuánto dinero tienes hoy entre cuentas, billeteras, efectivo y ahorros que
     puedas sacar?"
  2. "¿Cuánto debes hoy en tarjetas de crédito?" (opcional; 0 si no tiene).
- **Migración:**
  ```sql
  -- Migración: cuadre de saldo (lo que la persona tiene frente a lo registrado).
  create table if not exists cuadres (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
    fecha timestamptz not null default now(),
    dinero numeric not null,
    deuda_tarjetas numeric not null default 0 check (deuda_tarjetas >= 0),
    created_at timestamptz default now()
  );
  alter table cuadres enable row level security;
  drop policy if exists "usuario ve/edita solo sus cuadres" on cuadres;
  create policy "usuario ve/edita solo sus cuadres" on cuadres
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  ```
- **Reglas de cálculo** (`src/utils/cuadre.ts`, nuevo):
  - `neto = dinero − deuda_tarjetas`.
  - `flujo` entre dos cuadres (por fecha) = ingresos ordinarios + extraordinarios +
    préstamos y reembolsos − gastos (esenciales + discrecionales + deuda).
  - El **ahorro** y el **pago de tarjeta** no entran al flujo:
    - El ahorro sigue dentro de "dinero".
    - Pagar la tarjeta baja el dinero y la deuda por igual.
  - `diferencia = netoActual − (netoAnterior + flujo)`:
    - Negativa: hubo gastos sin registrar.
    - Positiva: hubo ingresos sin registrar, o gastos registrados de más.
  - El primer cuadre es solo el punto de partida y no muestra diferencia.
- **Código:**
  1. **`src/types.ts`:** `Cuadre`.
  2. **`src/db.ts`:** `obtenerCuadres` y `crearCuadre`.
  3. **`src/data/useCuadres.ts`:** carga los cuadres y expone el último y la
     diferencia.
  4. **UI:**
     - **`src/components/CuadreSheet.tsx`:** los dos campos de monto, reusando
       `CampoMonto.tsx`.
     - **`src/pages/Resumen.tsx`:** entre el día 1 y el 5 del mes, si no hay cuadre en
       ese mes, mostrar una invitación descartable a hacerlo.
     - **Resultado con diferencia:** si `|diferencia| >= 50.000`, mostrar "No
       alcanzaste a registrar $X" con un botón que la registra como un movimiento
       "Sin detalle" en el mes anterior. Es un egreso esencial si la diferencia es
       negativa y un ingreso ordinario si es positiva.
     - **Perfil:** historial de cuadres.
- **Aceptación:**
  - Cuadre del 1-oct: dinero 2.000.000, tarjetas 0. En octubre se registran
    3.000.000 de ingresos, 2.500.000 de gastos y 400.000 de ahorro.
  - Cuadre del 1-nov: dinero 2.300.000, tarjetas 0.
  - Esperado: 2.000.000 + 3.000.000 − 2.500.000 = **2.500.000**.
  - Diferencia: **−200.000**. Muestra "No alcanzaste a registrar $200.000".

### A2: tasa de ahorro

Depende de B2.

- **Regla:**
  - `tasa = (Σ ingresos ordinarios − Σ gastos) / Σ ingresos ordinarios`, sobre los
    **últimos 3 meses cerrados** (sin el mes en curso).
  - Los ingresos extraordinarios no entran, para que la prima no infle el resultado.
  - También se reporta `ahorroSeparado = Σ ahorro / Σ ingresos ordinarios`.
  - Devuelve `null` si no hay al menos 1 mes cerrado con ingresos ordinarios.
  - Puede ser negativa, lo que significa que se gastó más de lo que entró.
  - Nota: la cuota de una deuda cuenta como gasto aunque parte sea capital.
    Es una simplificación aceptada en esta fase.
- **Dónde:**
  - `src/utils/contabilidad.ts`: `tasaDeAhorro(transacciones, categoriaPorId, hoy)`.
  - Se muestra primero en `src/pages/Reportes.tsx`, en un bloque nuevo arriba de
    "Últimos 6 meses". En la Fase 3 sube al Resumen.
- **Aceptación:**
  - Con 3 meses de 2.500.000 de ingreso ordinario y 2.000.000 de gastos, la tasa es
    **20%**.
  - Si uno de esos meses además tiene una prima de 1.250.000, la tasa sigue en
    **20%**.

---

## Fase 3: la pantalla principal

**Antes de empezar**, resolver las decisiones pendientes 1 y 2 (al final del documento).

### A1: disponible para gastar

Depende de B1, B2, B3 y A4.

- **Regla** (mes actual):
  ```
  base        = ingresos ordinarios registrados + ingresos ordinarios recurrentes pendientes
  comprometido = gastos registrados + ahorro registrado
               + egresos recurrentes pendientes (gasto o ahorro)
               + provisionDelMes (A4)
  disponible  = base − comprometido
  porDia      = disponible / días que faltan del mes (incluido hoy)
  ```
  - Los ingresos extraordinarios **no** entran en la base. Al registrar uno, la app
    sugiere a qué destinarlo.
  - Si la base es 0: no mostrar un número negativo. Mostrar "Registra tu ingreso del
    mes para saber cuánto puedes gastar".
  - Para meses pasados, se muestra el resultado del mes ("Te sobraron $X" o
    "Faltaron $X").
- **Dónde:**
  - `src/utils/disponible.ts` (nuevo).
  - Se muestra en `src/components/BalanceCard.tsx`, reemplazando la cifra actual de
    "Disponible", que hoy es ingresos − egresos.
- **Aceptación:**
  - El 10-nov: salario de 3.000.000 registrado; gastos de 1.700.000 (incluye el
    arriendo); ahorro de 300.000; recurrente de servicios pendiente por 200.000;
    provisión de 150.000.
  - Disponible: **650.000**. Por día: 650.000 / 21 = **30.952**.

### A3: meses de colchón

Depende de B1 y B4.

- **Regla:**
  - `gastoEsencialMensual` = promedio de los últimos 3 meses cerrados de
    (gastos esenciales + cuotas de deuda) + `costoMensualEquivalente` (A4).
  - `colchon = max(0, dinero − deuda_tarjetas del último cuadre) / gastoEsencialMensual`.
  - Devuelve `null` si no hay cuadre o no hay ningún mes cerrado: se muestra
    "Haz tu primer cuadre", nunca 0.
  - Si el último cuadre tiene más de 45 días, se muestra "con datos de hace N días".
  - Referencia que se muestra: 3 a 6 meses. Si la decisión pendiente 2 resulta en
    ingreso variable, 6 a 12.
- **Dónde:**
  - `src/utils/colchon.ts` (nuevo).
  - Se muestra en `src/pages/Resumen.tsx`.
- **Aceptación:**
  - Dinero 5.400.000, tarjetas 0, gasto esencial promedio 1.500.000 y gastos
    anuales de 300.000 al mes: 5.400.000 / 1.800.000 = **3,0 meses**.

### Reorganizar el Resumen

- **Arriba, las tres cifras:**
  - Disponible para gastar (con su valor por día).
  - Tasa de ahorro (3 meses).
  - Meses de colchón.
- **Debajo, sin cambios:** "Por confirmar" (B3), el gráfico de "En qué se fue" y los
  últimos movimientos.
- Es un cambio de UI grande: aplica las tres skills y `DESIGN.md`.

---

## Fase 4: menos fricción

No dependen de nada. Pueden ir en paralelo desde la Fase 1 si hay otra persona.

### A5: registro sin conexión

- **Alcance de la v1:** solo **crear** movimientos sin conexión. Editar y borrar
  siguen pidiendo conexión, con un mensaje claro.
- **Qué hacer:**
  1. **`src/db.ts`:** `crearTransaccion` acepta un `id` generado en el cliente
     (`crypto.randomUUID()`) y usa `upsert(..., { onConflict: 'id', ignoreDuplicates: true })`.
     Así reintentar no duplica el movimiento.
  2. **`src/data/colaSincronizacion.ts` (nuevo):** guarda la cola de pendientes y
     una copia de categorías y transacciones para abrir la app sin señal.
     - Usar IndexedDB mediante `idb-keyval`, que guarda y lee datos del navegador
       en unos 600 bytes. Alternativa sin dependencia: `localStorage` con
       try/catch, limitado a unos 5 MB.
     - Se sincroniza al recibir el evento `online` y al abrir la app.
  3. **`src/data/FinanzasContext.tsx`:**
     - `crearMovimiento` agrega el movimiento al estado de inmediato, de forma
       optimista, marcado como `pendiente`.
     - Si falla por la red, lo deja en la cola. Si falla por validación, lo revierte
       y avisa.
  4. **UI:** un indicador de "pendiente" en `FilaMovimiento.tsx` y un aviso discreto
     de "Sin conexión: se guardará al volver la señal".
  5. **Service worker:** no cambiar la estrategia de caché de `vite.config.ts` sin
     revisar `AvisoActualizacion` ni `public/sw-transicion.js`.
- **Aceptación:**
  - En modo avión se registra un gasto: aparece de una vez en el Resumen y cuenta en
    los totales.
  - Al volver la conexión se guarda una sola vez en Supabase.
  - Al cerrar y abrir la app sin conexión, se ven los datos de la última sesión.

### A6: autocompletar y gastos hormiga

- **Autocompletar:**
  - **`src/utils/sugerencias.ts` (nuevo):** normaliza la descripción (minúsculas,
    sin tildes, sin espacios dobles). Para cada descripción guarda la categoría más
    usada y el último monto.
  - **En `NuevoMovimientoSheet.tsx`:**
    - Al escribir, muestra hasta 3 sugerencias.
    - Tocar una completa la categoría y el monto, y el monto sigue editable.
    - Para ordenar, reusa la idea de `useCategoriasPorUso.ts`.
  - **Aceptación:** "tinto" sugiere Comida y el último monto. Registrarlo toma 3 toques.
- **Gastos hormiga:**
  - **En `src/utils/estadisticasMes.ts`,** `gastosHormiga(transaccionesDelMes, categoriaPorId)`:
    - Toma los gastos discrecionales y esenciales que no son fijos, de ≤ 20.000 cada
      uno.
    - Los agrupa por descripción normalizada y conserva los grupos con 4 o más
      registros en el mes.
    - Devuelve el monto mensual y ese monto × 12.
  - **En Reportes:** un bloque "Gastos pequeños que se repiten", con tono neutro y
    sin regaños.
  - **Aceptación:** 22 tintos de 6.000 dan **132.000 al mes y 1.584.000 al año**.

---

## Después (especificación corta; se detalla al llegar)

| # | Qué | Depende de | Notas para el desarrollador |
|---|---|---|---|
| D1 | Deudas y relación deuda/ingreso | B1, B3 | Tabla `deudas` (nombre, saldo, cuota, `tasa_mensual` opcional, día de pago, `recurrente_id`). La relación es Σ cuotas / promedio de ingresos ordinarios de 3 meses. Mostrarla como referencia: 30–35% es el umbral habitual de las entidades, sin color de alerta. |
| D2 | Compras a cuotas con tarjeta | D1 | El consumo cuenta completo el día de la compra. Cada cuota se separa en capital (pago de tarjeta) e interés (gasto). |
| D3 | Declaración de renta | B2 | `src/utils/parametrosTributarios.ts` con la UVT y los topes **por año** (verificar con la DIAN cada año; nunca fijos en el código). Acumulado anual de ingresos y de consumos frente a 1.400 UVT; avisar al llegar al 70%. Etiqueta opcional "deducible". |
| D4 | Patrimonio neto (trimestral) | B4, D1 | Activos (último cuadre + cesantías + otros) − pasivos (deudas de D1 + tarjetas). |
| D5 | Recordatorio diario | B3 | Web Push: Edge Function de Supabase + cron + claves VAPID. En iOS solo funciona con la PWA instalada (16.4+). Se envía solo si ese día no hubo registro y se apaga solo tras 5 días ignorado. |
| D6 | Inflación en comparaciones anuales | — | IPC anual del DANE como parámetro por año. Solo en comparaciones de 12 meses o más. |
| D7 | Ingreso base para ingresos variables | Decisión 2 | Base = promedio de los 3 meses más bajos de los últimos 6. Reemplaza los ingresos ordinarios en la base de A1. |

---

## Decisiones pendientes (producto)

1. **Ciclo de pago.** Si la mayoría de usuarios cobra el 30 o por quincena, A1 debe
   calcularse sobre un ciclo configurable (por ejemplo, del 30 al 29) y no sobre el
   mes calendario. Eso cambia todos los filtros por mes y se vuelve bloqueante de la
   Fase 3.
2. **Tipo de ingreso** (fijo, variable o mixto). Define la meta del colchón (A3) y si
   D7 sube a la Fase 3. Se preguntaría una sola vez, desde Perfil.
3. **Grupos.** Se retiró en `36769e3`. Si vuelve, cada gasto compartido debe crear un
   egreso personal por la parte de cada miembro, y los pagos entre miembros deben
   registrarse como préstamo o devolución, nunca como ingreso.

---

## Resumen de dependencias

```
Fase 0:  C0  C1  C2  C3  C4                      (sueltos)

B1 Naturaleza ─► B2 Contabilidad ─┬─► A2 Tasa de ahorro ───────────┐
   │                              ├─► B4 Cuadre ─► A3 Colchón ─────┤
   │                              └─► D3 Renta                     ├─► Resumen nuevo
   └─► D1 Deudas ─► D2 Cuotas TC                                   │
B3 Recurrentes ─► C2 completa, A1 Disponible ◄── A4 Gastos del año ┘
A5 Sin conexión, A6 Autocompletar                (en paralelo)
```
