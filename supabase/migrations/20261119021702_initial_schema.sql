begin;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table public.admin_account (
  singleton boolean primary key default true check (singleton),
  user_id uuid not null references auth.users(id) on delete cascade
);
alter table public.admin_account enable row level security;
revoke all on public.admin_account from anon, authenticated;

create function private.is_admin() returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists(select 1 from public.admin_account where user_id = auth.uid());
$$;
revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to authenticated;

create table public.book_prices (
  pages smallint primary key check (pages in (12, 24)),
  price_piastres integer not null check (price_piastres between 1 and 10000000)
);
insert into public.book_prices values (12, 25000), (24, 35000);

create table public.discount_rules (
  book_count smallint primary key check (book_count in (2, 3)),
  percent smallint not null check (percent between 0 and 100)
);
insert into public.discount_rules values (2, 10), (3, 20);

create table public.shipping_rates (
  code text primary key,
  name_ar text not null,
  fee_piastres integer check (fee_piastres between 0 and 10000000)
);
insert into public.shipping_rates (code, name_ar) values
('cairo','القاهرة'), ('giza','الجيزة'), ('alexandria','الإسكندرية'),
('dakahlia','الدقهلية'), ('beheira','البحيرة'), ('fayoum','الفيوم'),
('gharbia','الغربية'), ('ismailia','الإسماعيلية'), ('kafr-el-sheikh','كفر الشيخ'),
('matrouh','مطروح'), ('minya','المنيا'), ('monufia','المنوفية'),
('new-valley','الوادي الجديد'), ('north-sinai','شمال سيناء'), ('port-said','بورسعيد'),
('qalyubia','القليوبية'), ('qena','قنا'), ('red-sea','البحر الأحمر'),
('sharqia','الشرقية'), ('sohag','سوهاج'), ('south-sinai','جنوب سيناء'),
('suez','السويس'), ('luxor','الأقصر'), ('aswan','أسوان'),
('assiut','أسيوط'), ('beni-suef','بني سويف'), ('damietta','دمياط');

create table public.site_content (
  key text primary key,
  value text not null check (length(value) <= 3000)
);
insert into public.site_content values ('subtitle', 'كتب تلوين مخصصة للأطفال');

create table public.portfolio (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(title) between 1 and 150),
  image_url text not null check (length(image_url) <= 2048 and image_url like 'https://%'),
  kind text not null check (kind in ('sample', 'authorized')),
  published boolean not null default false
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  customer_name text not null,
  phone text not null,
  address text not null,
  governorate text not null references public.shipping_rates(code),
  notes text,
  count_12 smallint not null check (count_12 between 0 and 3),
  count_24 smallint not null check (count_24 between 0 and 3),
  price_12 integer not null,
  price_24 integer not null,
  discount_percent smallint not null check (discount_percent between 0 and 100),
  shipping_piastres integer,
  subtotal_piastres integer generated always as (count_12 * price_12 + count_24 * price_24) stored,
  discount_piastres integer generated always as
    ((discount_percent::bigint * (count_12 * price_12 + count_24 * price_24) + 50) / 100) stored,
  photo_path text,
  status text not null default 'new' check (status in ('new', 'confirmed', 'completed', 'cancelled')),
  check (count_12 + count_24 between 1 and 3)
);
create index orders_created_at_idx on public.orders (created_at desc);
create index orders_governorate_idx on public.orders (governorate);

create table public.push_subscriptions (
  endpoint text primary key,
  subscription jsonb not null
);
create table public.notification_jobs (
  order_id uuid primary key references public.orders(id) on delete cascade,
  created_at timestamptz not null default now(),
  email_sent_at timestamptz,
  push_sent_at timestamptz,
  leased_until timestamptz
);

do $$
declare item text;
begin
  foreach item in array array['book_prices', 'discount_rules', 'shipping_rates', 'site_content', 'portfolio', 'orders', 'push_subscriptions', 'notification_jobs']
  loop
    execute format('alter table public.%I enable row level security', item);
    execute format('revoke all on public.%I from anon, authenticated', item);
    execute format('grant select, insert, update, delete on public.%I to service_role', item);
  end loop;
  foreach item in array array['book_prices', 'discount_rules', 'shipping_rates', 'site_content', 'portfolio']
  loop
    execute format('grant select on public.%I to anon, authenticated', item);
    execute format('grant update on public.%I to authenticated', item);
    execute format('create policy admin_write on public.%I for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()))', item);
  end loop;
  foreach item in array array['book_prices', 'discount_rules', 'shipping_rates', 'site_content']
  loop
    execute format('create policy public_read on public.%I for select to anon, authenticated using (true)', item);
  end loop;
end
$$;

grant insert, delete on public.portfolio to authenticated;
create policy portfolio_public on public.portfolio for select to anon, authenticated using (published);
create policy portfolio_admin on public.portfolio for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

grant select, update(status) on public.orders to authenticated;
create policy orders_admin_read on public.orders for select to authenticated using ((select private.is_admin()));
create policy orders_admin_status on public.orders for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

grant select, insert, update, delete on public.push_subscriptions to authenticated;
create policy subscriptions_admin on public.push_subscriptions for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

create function public.is_project_admin() returns boolean
language sql stable security invoker set search_path = ''
as $$ select private.is_admin() $$;
revoke all on function public.is_project_admin() from public, anon;
grant execute on function public.is_project_admin() to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('child-photos', 'child-photos', false, 2097152, array['image/jpeg', 'image/png', 'image/webp']);
create policy child_photo_admin_read on storage.objects for select to authenticated
  using (bucket_id = 'child-photos' and (select private.is_admin()));

create function public.place_order(
  order_id uuid, customer text, customer_phone text, delivery_address text, region text,
  order_notes text, books_12 smallint, books_24 smallint, photo text
) returns uuid
language sql volatile security invoker set search_path = ''
as $$
  with created as (
    insert into public.orders (
      id, customer_name, phone, address, governorate, notes, count_12, count_24,
      price_12, price_24, discount_percent, shipping_piastres, photo_path
    )
    select order_id, customer, customer_phone, delivery_address, region, order_notes,
      books_12, books_24, a.price_piastres, b.price_piastres, coalesce(d.percent, 0),
      s.fee_piastres, photo
    from public.book_prices a cross join public.book_prices b
    join public.shipping_rates s on s.code = region
    left join public.discount_rules d on d.book_count = books_12 + books_24
    where a.pages = 12 and b.pages = 24
    returning id
  )
  insert into public.notification_jobs (order_id) select id from created
  returning public.notification_jobs.order_id
$$;
revoke all on function public.place_order(uuid, text, text, text, text, text, smallint, smallint, text) from public, anon, authenticated;
grant execute on function public.place_order(uuid, text, text, text, text, text, smallint, smallint, text) to service_role;

create function public.claim_notification_jobs()
returns setof public.notification_jobs
language sql volatile security invoker set search_path = ''
as $$
  with next_jobs as (
    select order_id from public.notification_jobs
    where (email_sent_at is null or push_sent_at is null)
      and (leased_until is null or leased_until < now())
    order by created_at
    limit 5
    for update skip locked
  )
  update public.notification_jobs j set leased_until = now() + interval '5 minutes'
  from next_jobs where j.order_id = next_jobs.order_id returning j.*
$$;
revoke all on function public.claim_notification_jobs() from public, anon, authenticated;
grant execute on function public.claim_notification_jobs() to service_role;

commit;
