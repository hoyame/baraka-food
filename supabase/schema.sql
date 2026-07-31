-- Baraka Food — schéma Supabase (menu persistant + commandes éphémères)

create table if not exists menu (
  id smallint primary key default 1,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  constraint menu_singleton check (id = 1)
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  status text not null default 'attente' check (status in ('attente', 'preparation', 'pret_cuisine', 'disponible', 'recuperee')),
  items jsonb not null,
  total numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create sequence if not exists order_code_seq;

create or replace function next_order_code()
returns text
language plpgsql
security definer
as $$
declare
  n bigint;
begin
  n := nextval('order_code_seq');
  return 'C' || n;
end;
$$;

grant execute on function next_order_code() to anon, authenticated;

alter table menu enable row level security;
alter table orders enable row level security;

drop policy if exists "menu read" on menu;
create policy "menu read" on menu for select using (true);
drop policy if exists "menu write" on menu;
create policy "menu write" on menu for update using (true) with check (true);
drop policy if exists "menu insert" on menu;
create policy "menu insert" on menu for insert with check (true);

drop policy if exists "orders read" on orders;
create policy "orders read" on orders for select using (true);
drop policy if exists "orders insert" on orders;
create policy "orders insert" on orders for insert with check (true);
drop policy if exists "orders update" on orders;
create policy "orders update" on orders for update using (true) with check (true);
drop policy if exists "orders delete" on orders;
create policy "orders delete" on orders for delete using (true);

alter table orders replica identity full;

alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table menu;

insert into storage.buckets (id, name, public)
values ('menu-images', 'menu-images', true)
on conflict (id) do nothing;

drop policy if exists "menu images public read" on storage.objects;
create policy "menu images public read" on storage.objects for select using (bucket_id = 'menu-images');
drop policy if exists "menu images public insert" on storage.objects;
create policy "menu images public insert" on storage.objects for insert with check (bucket_id = 'menu-images');
drop policy if exists "menu images public update" on storage.objects;
create policy "menu images public update" on storage.objects for update using (bucket_id = 'menu-images');
drop policy if exists "menu images public delete" on storage.objects;
create policy "menu images public delete" on storage.objects for delete using (bucket_id = 'menu-images');
