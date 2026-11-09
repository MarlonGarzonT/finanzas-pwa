-- Ejecutar una sola vez en el SQL Editor de tu proyecto de Supabase.

create table if not exists categorias (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  nombre text not null,
  emoji text not null default '🏷️',
  tipo text not null default 'egreso' check (tipo in ('ingreso', 'egreso')),
  es_fijo boolean not null default false,
  created_at timestamptz default now()
);

create table if not exists transacciones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  fecha timestamptz not null default now(),
  item text not null,
  categoria_id uuid references categorias(id) on delete set null,
  tipo text not null check (tipo in ('ingreso', 'egreso')),
  monto numeric not null check (monto > 0),
  semana_del_mes int not null,
  created_at timestamptz default now()
);

create index if not exists transacciones_user_fecha_idx on transacciones (user_id, fecha desc);

alter table categorias enable row level security;
alter table transacciones enable row level security;

drop policy if exists "usuario ve/edita solo sus categorias" on categorias;
create policy "usuario ve/edita solo sus categorias" on categorias
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "usuario ve/edita solo sus transacciones" on transacciones;
create policy "usuario ve/edita solo sus transacciones" on transacciones
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Migración: si ya tenías el esquema anterior (sin la columna emoji), ejecuta
-- este bloque una sola vez en el SQL Editor. Es seguro volver a correrlo.
alter table categorias add column if not exists emoji text not null default '🏷️';

update categorias set emoji = case
  when nombre ilike '%comida%' then '🍔'
  when nombre ilike '%transporte%' then '🚗'
  when nombre ilike '%vivienda%' then '🏠'
  when nombre ilike '%salud%' then '💊'
  when nombre ilike '%entretenimiento%' then '🎮'
  when nombre ilike '%servicio%' then '💡'
  when nombre ilike '%salario%' then '💰'
  else emoji
end
where emoji = '🏷️';

-- Migración: agrega tipo (ingreso/egreso) y es_fijo (gasto mensual fijo,
-- ej. cuota de moto o celular) a categorías existentes. Segura de repetir.
alter table categorias add column if not exists tipo text not null default 'egreso' check (tipo in ('ingreso', 'egreso'));
alter table categorias add column if not exists es_fijo boolean not null default false;

update categorias set tipo = 'ingreso' where tipo = 'egreso' and nombre ilike '%salario%';

-- ============================================================================
-- Grupos: gastos compartidos entre varias cuentas (ej. un viaje con amigos).
-- A diferencia de categorias/transacciones (dueño único), estas tablas son
-- visibles para TODOS los miembros de un grupo, via grupo_miembros.
-- ============================================================================

create table if not exists grupos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  codigo text not null unique,
  creado_por uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists grupo_miembros (
  grupo_id uuid not null references grupos(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  nombre_visible text not null,
  joined_at timestamptz default now(),
  primary key (grupo_id, user_id)
);

create table if not exists grupo_gastos (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid not null references grupos(id) on delete cascade,
  pagado_por uuid not null references auth.users(id),
  descripcion text not null,
  monto numeric not null check (monto > 0),
  fecha timestamptz not null default now(),
  creado_por uuid not null references auth.users(id) default auth.uid(),
  created_at timestamptz default now()
);

create table if not exists grupo_gasto_partes (
  gasto_id uuid not null references grupo_gastos(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  monto numeric not null check (monto >= 0),
  primary key (gasto_id, user_id)
);

create table if not exists grupo_pagos (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid not null references grupos(id) on delete cascade,
  de_user_id uuid not null references auth.users(id),
  a_user_id uuid not null references auth.users(id),
  monto numeric not null check (monto > 0),
  fecha timestamptz not null default now(),
  created_at timestamptz default now()
);

create index if not exists grupo_miembros_user_idx on grupo_miembros (user_id);
create index if not exists grupo_gastos_grupo_idx on grupo_gastos (grupo_id, fecha desc);
create index if not exists grupo_gasto_partes_gasto_idx on grupo_gasto_partes (gasto_id);
create index if not exists grupo_pagos_grupo_idx on grupo_pagos (grupo_id, fecha desc);

alter table grupos enable row level security;
alter table grupo_miembros enable row level security;
alter table grupo_gastos enable row level security;
alter table grupo_gasto_partes enable row level security;
alter table grupo_pagos enable row level security;

-- Visible/editable solo para quienes son miembros de ese grupo. No hay
-- politica de INSERT en grupos ni en grupo_miembros: la unica forma de crear
-- un grupo o entrar a uno es a traves de las funciones SECURITY DEFINER de
-- abajo (crear_grupo / unirse_a_grupo), que resuelven el problema de
-- "arranque" (nadie es miembro todavia cuando el grupo se crea).

drop policy if exists "miembros ven su grupo" on grupos;
create policy "miembros ven su grupo" on grupos
  for select using (
    exists (select 1 from grupo_miembros gm where gm.grupo_id = grupos.id and gm.user_id = auth.uid())
  );

drop policy if exists "miembros ven a los demas miembros" on grupo_miembros;
create policy "miembros ven a los demas miembros" on grupo_miembros
  for select using (
    exists (
      select 1 from grupo_miembros gm2
      where gm2.grupo_id = grupo_miembros.grupo_id and gm2.user_id = auth.uid()
    )
  );

drop policy if exists "miembros ven los gastos de su grupo" on grupo_gastos;
create policy "miembros ven los gastos de su grupo" on grupo_gastos
  for select using (
    exists (select 1 from grupo_miembros gm where gm.grupo_id = grupo_gastos.grupo_id and gm.user_id = auth.uid())
  );

drop policy if exists "miembros crean gastos en su grupo" on grupo_gastos;
create policy "miembros crean gastos en su grupo" on grupo_gastos
  for insert with check (
    exists (select 1 from grupo_miembros gm where gm.grupo_id = grupo_gastos.grupo_id and gm.user_id = auth.uid())
  );

drop policy if exists "el creador edita su gasto" on grupo_gastos;
create policy "el creador edita su gasto" on grupo_gastos
  for update using (creado_por = auth.uid()) with check (creado_por = auth.uid());

drop policy if exists "el creador borra su gasto" on grupo_gastos;
create policy "el creador borra su gasto" on grupo_gastos
  for delete using (creado_por = auth.uid());

drop policy if exists "miembros ven las partes de gastos de su grupo" on grupo_gasto_partes;
create policy "miembros ven las partes de gastos de su grupo" on grupo_gasto_partes
  for select using (
    exists (
      select 1 from grupo_gastos gg
      join grupo_miembros gm on gm.grupo_id = gg.grupo_id
      where gg.id = grupo_gasto_partes.gasto_id and gm.user_id = auth.uid()
    )
  );

drop policy if exists "miembros ven los pagos de su grupo" on grupo_pagos;
create policy "miembros ven los pagos de su grupo" on grupo_pagos
  for select using (
    exists (select 1 from grupo_miembros gm where gm.grupo_id = grupo_pagos.grupo_id and gm.user_id = auth.uid())
  );

drop policy if exists "miembros registran pagos en su grupo" on grupo_pagos;
create policy "miembros registran pagos en su grupo" on grupo_pagos
  for insert with check (
    exists (select 1 from grupo_miembros gm where gm.grupo_id = grupo_pagos.grupo_id and gm.user_id = auth.uid())
  );

-- Crea un grupo nuevo y agrega a quien lo crea como primer miembro. Corre
-- como SECURITY DEFINER porque, al momento de crear el grupo, el usuario
-- todavia no es miembro (RLS normal no lo dejaria insertar en grupo_miembros).
create or replace function crear_grupo(p_nombre text, p_nombre_visible text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_grupo_id uuid;
  v_codigo text;
begin
  loop
    v_codigo := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    exit when not exists (select 1 from grupos where codigo = v_codigo);
  end loop;

  insert into grupos (nombre, codigo, creado_por)
  values (p_nombre, v_codigo, auth.uid())
  returning id into v_grupo_id;

  insert into grupo_miembros (grupo_id, user_id, nombre_visible)
  values (v_grupo_id, auth.uid(), p_nombre_visible);

  return v_grupo_id;
end;
$$;

grant execute on function crear_grupo(text, text) to authenticated;

-- Une al usuario actual a un grupo existente por su codigo de invitacion.
-- Mismo motivo SECURITY DEFINER: todavia no es miembro, asi que no podria
-- ver la fila de grupos (RLS) ni insertarse a si mismo en grupo_miembros.
create or replace function unirse_a_grupo(p_codigo text, p_nombre_visible text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_grupo_id uuid;
begin
  select id into v_grupo_id from grupos where codigo = upper(p_codigo);
  if v_grupo_id is null then
    raise exception 'Código inválido';
  end if;

  insert into grupo_miembros (grupo_id, user_id, nombre_visible)
  values (v_grupo_id, auth.uid(), p_nombre_visible)
  on conflict (grupo_id, user_id) do update set nombre_visible = excluded.nombre_visible;

  return v_grupo_id;
end;
$$;

grant execute on function unirse_a_grupo(text, text) to authenticated;

-- Crea un gasto de grupo junto con como se divide entre los miembros, en una
-- sola transaccion (evita que el gasto quede creado sin sus partes si la
-- segunda escritura falla). p_partes es un array jsonb: [{"user_id": "...",
-- "monto": 123}, ...] y debe sumar exactamente p_monto. SECURITY DEFINER
-- porque grupo_gasto_partes no tiene politica de INSERT para clientes
-- normales (solo esta funcion escribe ahi) - por eso valida la membresia a
-- mano antes de insertar, ya que se salta el RLS de grupo_gastos tambien.
create or replace function crear_gasto_grupo(
  p_grupo_id uuid,
  p_descripcion text,
  p_monto numeric,
  p_pagado_por uuid,
  p_partes jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gasto_id uuid;
  v_suma numeric;
begin
  if not exists (select 1 from grupo_miembros gm where gm.grupo_id = p_grupo_id and gm.user_id = auth.uid()) then
    raise exception 'No eres miembro de este grupo';
  end if;

  if not exists (select 1 from grupo_miembros gm where gm.grupo_id = p_grupo_id and gm.user_id = p_pagado_por) then
    raise exception 'Quien pagó no es miembro de este grupo';
  end if;

  select coalesce(sum((parte->>'monto')::numeric), 0) into v_suma
  from jsonb_array_elements(p_partes) as parte;

  if v_suma <> p_monto then
    raise exception 'La suma de las partes (%) no coincide con el monto total (%)', v_suma, p_monto;
  end if;

  insert into grupo_gastos (grupo_id, pagado_por, descripcion, monto, creado_por)
  values (p_grupo_id, p_pagado_por, p_descripcion, p_monto, auth.uid())
  returning id into v_gasto_id;

  insert into grupo_gasto_partes (gasto_id, user_id, monto)
  select v_gasto_id, (parte->>'user_id')::uuid, (parte->>'monto')::numeric
  from jsonb_array_elements(p_partes) as parte;

  return v_gasto_id;
end;
$$;

grant execute on function crear_gasto_grupo(uuid, text, numeric, uuid, jsonb) to authenticated;

-- ============================================================================
-- Mejoras financieras (docs/plan-mejoras-financieras.md). Correr estos bloques
-- en este orden ANTES de publicar la versión de la app que los usa: la app
-- nueva lee categorias.naturaleza y la tabla gastos_anuales.
-- ============================================================================

-- Migración (C3): semana_del_mes deja de usarse. Opcional para versiones viejas.
alter table transacciones alter column semana_del_mes drop not null;

-- Migración (B1): naturaleza de la categoría (cómo cuenta cada movimiento en las
-- métricas). Segura de repetir. Las reglas por nombre son las mismas de
-- src/utils/naturalezaCategoria.ts (sugerirNaturaleza).
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

-- Migración (B2): categorías de fábrica nuevas para usuarios que no tengan una
-- de esa naturaleza. Segura de repetir. Va después de B1.
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

-- Migración (A4): gastos que llegan una vez al año (SOAT, predial, matrícula...).
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

-- ============================================================================
-- Préstamos (plata que le prestas a alguien) y avisos push cuando se vencen.
-- Correr ANTES de publicar la versión de la app que los usa.
-- ============================================================================

-- Migración: préstamos. Lo que falta por cobrar no se guarda: es el monto menos
-- los abonos (transacciones de ingreso con su prestamo_id).
create table if not exists prestamos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  persona text not null check (length(trim(persona)) > 0),
  monto numeric not null check (monto > 0),
  -- Día en que quedó de pagar, en hora de Colombia.
  fecha_devolucion date not null,
  nota text,
  -- Último aviso push enviado por estar vencido (lo escribe la Edge Function).
  ultimo_aviso timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists prestamos_user_idx on prestamos (user_id);
alter table prestamos enable row level security;
drop policy if exists "usuario ve/edita solo sus prestamos" on prestamos;
create policy "usuario ve/edita solo sus prestamos" on prestamos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- La salida del préstamo y cada abono son transacciones enlazadas. Borrar el
-- préstamo borra sus movimientos: deshace todo lo que registró.
alter table transacciones add column if not exists prestamo_id uuid references prestamos(id) on delete cascade;
create index if not exists transacciones_prestamo_idx on transacciones (prestamo_id) where prestamo_id is not null;

-- Crea el préstamo y su salida en una sola transacción: nunca queda un
-- préstamo sin su salida (o al revés) si la conexión se cae a la mitad.
-- security invoker: corre con los permisos de quien llama, así que el RLS aplica.
create or replace function crear_prestamo(
  p_persona text,
  p_monto numeric,
  p_fecha_devolucion date,
  p_nota text,
  p_fecha timestamptz
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_prestamo prestamos;
  v_transaccion transacciones;
begin
  insert into prestamos (persona, monto, fecha_devolucion, nota)
  values (trim(p_persona), p_monto, p_fecha_devolucion, nullif(trim(coalesce(p_nota, '')), ''))
  returning * into v_prestamo;

  insert into transacciones (fecha, item, categoria_id, tipo, monto, semana_del_mes, prestamo_id)
  values (
    p_fecha,
    'Préstamo a ' || v_prestamo.persona,
    null,
    'egreso',
    p_monto,
    ceil(extract(day from p_fecha at time zone 'America/Bogota') / 7.0)::int,
    v_prestamo.id
  )
  returning * into v_transaccion;

  return jsonb_build_object('prestamo', to_jsonb(v_prestamo), 'transaccion', to_jsonb(v_transaccion));
end;
$$;
revoke execute on function crear_prestamo(text, numeric, date, text, timestamptz) from public, anon;
grant execute on function crear_prestamo(text, numeric, date, text, timestamptz) to authenticated;

-- Migración: suscripciones a notificaciones push (una por dispositivo).
create table if not exists suscripciones_push (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
create index if not exists suscripciones_push_user_idx on suscripciones_push (user_id);
alter table suscripciones_push enable row level security;
drop policy if exists "usuario ve/edita solo sus suscripciones" on suscripciones_push;
create policy "usuario ve/edita solo sus suscripciones" on suscripciones_push
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Un dispositivo compartido puede tener la suscripción de otra cuenta: el
-- endpoint es del navegador, no de la persona. Esta función se la pasa a quien
-- la activa ahora (el RLS no dejaría ver ni borrar la fila ajena).
create or replace function guardar_suscripcion_push(p_endpoint text, p_p256dh text, p_auth text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Sin sesión';
  end if;
  delete from suscripciones_push where endpoint = p_endpoint;
  insert into suscripciones_push (user_id, endpoint, p256dh, auth)
  values (auth.uid(), p_endpoint, p_p256dh, p_auth);
end;
$$;
revoke execute on function guardar_suscripcion_push(text, text, text) from public, anon;
grant execute on function guardar_suscripcion_push(text, text, text) to authenticated;

-- Préstamos vencidos con saldo a los que toca avisar: nunca avisados o
-- avisados hace una semana o más (con margen por si el cron corre unos
-- minutos antes). Solo la usa la Edge Function, con la service role.
create or replace function prestamos_por_avisar()
returns table (prestamo_id uuid, user_id uuid, persona text, saldo numeric, fecha_devolucion date)
language sql
stable
security invoker
set search_path = public
as $$
  select p.id, p.user_id, p.persona,
         p.monto - coalesce(sum(t.monto) filter (where t.tipo = 'ingreso'), 0) as saldo,
         p.fecha_devolucion
  from prestamos p
  left join transacciones t on t.prestamo_id = p.id
  where p.fecha_devolucion < (now() at time zone 'America/Bogota')::date
    and (p.ultimo_aviso is null or p.ultimo_aviso < now() - interval '6 days 20 hours')
  group by p.id
  having p.monto - coalesce(sum(t.monto) filter (where t.tipo = 'ingreso'), 0) > 0;
$$;
revoke execute on function prestamos_por_avisar() from public, anon, authenticated;
grant execute on function prestamos_por_avisar() to service_role;
