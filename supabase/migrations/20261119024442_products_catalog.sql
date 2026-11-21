create table public.products (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) between 1 and 150),
  description text not null default '' check (length(description) <= 1200),
  image_url text not null check (image_url like 'https://%' and length(image_url) <= 2048),
  price_piastres integer check (price_piastres between 0 and 10000000),
  published boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.products enable row level security;
revoke all on public.products from public, anon, authenticated;
grant select on public.products to anon, authenticated;
grant insert, update on public.products to authenticated;
create policy published_products on public.products for select to anon, authenticated using (published);
create policy admin_read_products on public.products for select to authenticated using ((select private.is_admin()));
create policy admin_insert_products on public.products for insert to authenticated with check ((select private.is_admin()));
create policy admin_update_products on public.products for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
