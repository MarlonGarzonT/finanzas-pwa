-- Ejecutar una sola vez en el SQL Editor de tu proyecto de Supabase.

create table if not exists categorias (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  nombre text not null,
  emoji text not null default '🏷️',
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
