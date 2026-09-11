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
