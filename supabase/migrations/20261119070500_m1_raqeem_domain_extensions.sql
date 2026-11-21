begin;

-- =============================================================================
-- 1. Extend book_prices & expose book_variants view
-- =============================================================================
alter table public.book_prices
  add column if not exists active boolean not null default true,
  add column if not exists title_ar text not null default '',
  add column if not exists title_en text not null default '',
  add column if not exists updated_at timestamptz not null default now();

update public.book_prices
set
  title_ar = case when pages = 12 then 'كتاب تلوين 12 صفحة' else 'كتاب تلوين 24 صفحة' end,
  title_en = case when pages = 12 then '12-Page Coloring Book' else '24-Page Coloring Book' end
where title_ar = '' or title_en = '';

create or replace view public.book_variants
with (security_invoker = true)
as
select
  pages as page_count,
  price_piastres,
  (price_piastres / 100) as price_egp,
  active,
  title_ar,
  title_en,
  updated_at
from public.book_prices;

grant select on public.book_variants to anon, authenticated, service_role;

-- =============================================================================
-- 2. Extend discount_rules (promotions) & support active/bilingual tiers
-- =============================================================================
alter table public.discount_rules
  add column if not exists active boolean not null default true,
  add column if not exists title_ar text not null default '',
  add column if not exists title_en text not null default '',
  add column if not exists starts_at timestamptz,
  add column if not exists ends_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

update public.discount_rules
set
  title_ar = case
    when book_count = 2 then 'خصم 10% عند طلب كتابين'
    when book_count = 3 then 'خصم 20% عند طلب 3 كتب أو أكثر'
    else 'عرض خصم الكميات'
  end,
  title_en = case
    when book_count = 2 then '10% off when ordering 2 books'
    when book_count = 3 then '20% off when ordering 3 or more books'
    else 'Quantity discount offer'
  end
where title_ar = '' or title_en = '';

grant insert on public.discount_rules to authenticated;

create policy admin_insert_discount_rules
  on public.discount_rules for insert to authenticated
  with check ((select private.is_admin()));

create or replace view public.promotions
with (security_invoker = true)
as
select
  book_count as min_quantity,
  percent,
  active,
  title_ar,
  title_en,
  starts_at,
  ends_at,
  updated_at
from public.discount_rules;

grant select on public.promotions to anon, authenticated, service_role;

-- =============================================================================
-- 3. Extend shipping_rates with English names for all 27 Egyptian governorates
-- =============================================================================
alter table public.shipping_rates
  add column if not exists name_en text not null default '',
  add column if not exists active boolean not null default true,
  add column if not exists sort_order smallint not null default 100,
  add column if not exists updated_at timestamptz not null default now();

update public.shipping_rates
set
  name_en = case code
    when 'cairo' then 'Cairo'
    when 'giza' then 'Giza'
    when 'alexandria' then 'Alexandria'
    when 'qalyubia' then 'Qalyubia'
    when 'dakahlia' then 'Dakahlia'
    when 'sharqia' then 'Sharqia'
    when 'gharbia' then 'Gharbia'
    when 'monufia' then 'Monufia'
    when 'beheira' then 'Beheira'
    when 'kafr-el-sheikh' then 'Kafr El Sheikh'
    when 'damietta' then 'Damietta'
    when 'port-said' then 'Port Said'
    when 'ismailia' then 'Ismailia'
    when 'suez' then 'Suez'
    when 'fayoum' then 'Fayoum'
    when 'beni-suef' then 'Beni Suef'
    when 'minya' then 'Minya'
    when 'assiut' then 'Assiut'
    when 'sohag' then 'Sohag'
    when 'qena' then 'Qena'
    when 'luxor' then 'Luxor'
    when 'aswan' then 'Aswan'
    when 'red-sea' then 'Red Sea'
    when 'new-valley' then 'New Valley'
    when 'matrouh' then 'Matrouh'
    when 'north-sinai' then 'North Sinai'
    when 'south-sinai' then 'South Sinai'
    else initcap(replace(code, '-', ' '))
  end,
  sort_order = case code
    when 'cairo' then 1
    when 'giza' then 2
    when 'alexandria' then 3
    when 'qalyubia' then 4
    when 'dakahlia' then 5
    when 'sharqia' then 6
    when 'gharbia' then 7
    when 'monufia' then 8
    when 'beheira' then 9
    when 'kafr-el-sheikh' then 10
    when 'damietta' then 11
    when 'port-said' then 12
    when 'ismailia' then 13
    when 'suez' then 14
    when 'fayoum' then 15
    when 'beni-suef' then 16
    when 'minya' then 17
    when 'assiut' then 18
    when 'sohag' then 19
    when 'qena' then 20
    when 'luxor' then 21
    when 'aswan' then 22
    when 'red-sea' then 23
    when 'new-valley' then 24
    when 'matrouh' then 25
    when 'north-sinai' then 26
    when 'south-sinai' then 27
    else 100
  end;

create or replace view public.governorates
with (security_invoker = true)
as
select
  code,
  name_ar,
  name_en,
  fee_piastres,
  active,
  sort_order,
  updated_at
from public.shipping_rates;

grant select on public.governorates to anon, authenticated, service_role;

-- =============================================================================
-- 4. Extend orders + create order_items & order_status_events
-- =============================================================================
alter table public.orders
  add column if not exists reference text unique default (
    'RQM-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
  ),
  add column if not exists whatsapp_phone text,
  add column if not exists lifecycle_stage text not null default 'new' check (
    lifecycle_stage in (
      'new',
      'contacted',
      'confirmed',
      'designing',
      'printing',
      'shipped',
      'delivered',
      'on_hold',
      'cancelled'
    )
  ),
  add column if not exists consent_accepted boolean not null default true check (consent_accepted = true),
  add column if not exists consent_at timestamptz not null default now(),
  add column if not exists final_quote_piastres integer check (final_quote_piastres is null or final_quote_piastres >= 0),
  add column if not exists admin_notes text check (admin_notes is null or length(admin_notes) <= 4000),
  add column if not exists idempotency_key text unique,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_lifecycle_stage_idx on public.orders (lifecycle_stage);
create index if not exists orders_reference_idx on public.orders (reference);

grant update(status, lifecycle_stage, admin_notes, final_quote_piastres, shipping_piastres, updated_at)
  on public.orders to authenticated;

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  item_index smallint not null default 0 check (item_index >= 0),
  page_count smallint not null check (page_count in (12, 24)),
  quantity smallint not null default 1 check (quantity between 1 and 20),
  child_name text not null check (length(trim(child_name)) between 1 and 100),
  child_age smallint not null check (child_age between 1 and 18),
  interests text check (interests is null or length(interests) <= 500),
  notes text check (notes is null or length(notes) <= 1000),
  photo_path text not null check (length(trim(photo_path)) between 1 and 500),
  unit_price_piastres integer not null check (unit_price_piastres between 1 and 10000000),
  created_at timestamptz not null default now()
);

create index if not exists order_items_order_id_idx on public.order_items (order_id, item_index);

alter table public.order_items enable row level security;
revoke all on public.order_items from public, anon, authenticated;
grant select, insert, update on public.order_items to service_role;
grant select on public.order_items to authenticated;

create policy order_items_admin_read
  on public.order_items for select to authenticated
  using ((select private.is_admin()));

create table if not exists public.order_status_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  old_status text,
  new_status text not null,
  actor_user_id uuid references auth.users(id) on delete set null,
  note text check (note is null or length(note) <= 1000),
  created_at timestamptz not null default now()
);

create index if not exists order_status_events_order_id_idx
  on public.order_status_events (order_id, created_at desc);

alter table public.order_status_events enable row level security;
revoke all on public.order_status_events from public, anon, authenticated;
grant select, insert, update on public.order_status_events to service_role;
grant select, insert on public.order_status_events to authenticated;

create policy order_status_events_admin_read
  on public.order_status_events for select to authenticated
  using ((select private.is_admin()));

create policy order_status_events_admin_insert
  on public.order_status_events for insert to authenticated
  with check ((select private.is_admin()));

create or replace function private.log_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.order_status_events (order_id, old_status, new_status, actor_user_id)
    values (new.id, null, coalesce(new.lifecycle_stage, new.status), auth.uid());
  elsif tg_op = 'UPDATE' and (
    old.status is distinct from new.status or
    old.lifecycle_stage is distinct from new.lifecycle_stage
  ) then
    new.updated_at := now();
    insert into public.order_status_events (order_id, old_status, new_status, actor_user_id)
    values (
      new.id,
      coalesce(old.lifecycle_stage, old.status),
      coalesce(new.lifecycle_stage, new.status),
      auth.uid()
    );
  end if;
  return new;
end;
$$;

create trigger trg_orders_status_event
  before insert or update on public.orders
  for each row execute function private.log_order_status_change();

-- =============================================================================
-- 5. Portfolio consent enforcement, bilingual CMS & site_settings
-- =============================================================================
alter table public.portfolio
  add column if not exists slug text unique,
  add column if not exists title_ar text,
  add column if not exists title_en text,
  add column if not exists description_ar text check (description_ar is null or length(description_ar) <= 2000),
  add column if not exists description_en text check (description_en is null or length(description_en) <= 2000),
  add column if not exists cartoon_image_url text check (cartoon_image_url is null or (length(cartoon_image_url) <= 2048 and cartoon_image_url like 'https://%')),
  add column if not exists coloring_page_url text check (coloring_page_url is null or (length(coloring_page_url) <= 2048 and coloring_page_url like 'https://%')),
  add column if not exists book_mockup_url text check (book_mockup_url is null or (length(book_mockup_url) <= 2048 and book_mockup_url like 'https://%')),
  add column if not exists guardian_consent_verified boolean not null default false,
  add column if not exists display_order smallint not null default 0,
  add column if not exists created_at timestamptz not null default now();

alter table public.portfolio
  add constraint portfolio_authorized_consent_check
  check (kind = 'sample' or not published or guardian_consent_verified = true);

create or replace view public.portfolio_entries
with (security_invoker = true)
as
select
  id,
  slug,
  title,
  coalesce(title_ar, title) as title_ar,
  coalesce(title_en, title) as title_en,
  description_ar,
  description_en,
  image_url,
  cartoon_image_url,
  coloring_page_url,
  book_mockup_url,
  kind,
  (kind = 'sample') as is_demo,
  guardian_consent_verified,
  published,
  display_order,
  created_at
from public.portfolio;

grant select on public.portfolio_entries to anon, authenticated, service_role;

alter table public.site_content
  add column if not exists value_en text check (value_en is null or length(value_en) <= 3000),
  add column if not exists value_json jsonb,
  add column if not exists updated_at timestamptz not null default now();

grant insert on public.site_content to authenticated;

create policy admin_insert_site_content
  on public.site_content for insert to authenticated
  with check ((select private.is_admin()));

create table if not exists public.site_settings (
  key text primary key check (length(trim(key)) between 1 and 100),
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;
revoke all on public.site_settings from public, anon, authenticated;
grant select, insert, update on public.site_settings to service_role;
grant select on public.site_settings to anon, authenticated;
grant insert, update on public.site_settings to authenticated;

create policy site_settings_public_read
  on public.site_settings for select to anon, authenticated
  using (true);

create policy site_settings_admin_write
  on public.site_settings for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- =============================================================================
-- 6. Admin notifications & durable notification_outbox
-- =============================================================================
create table if not exists public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  type text not null default 'new_order' check (type in ('new_order', 'status_change', 'system')),
  title_ar text not null check (length(title_ar) <= 300),
  title_en text not null check (length(title_en) <= 300),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists admin_notifications_unread_idx
  on public.admin_notifications (read_at, created_at desc);

alter table public.admin_notifications enable row level security;
revoke all on public.admin_notifications from public, anon, authenticated;
grant select, insert, update on public.admin_notifications to service_role;
grant select, update(read_at) on public.admin_notifications to authenticated;

create policy admin_notifications_admin_read
  on public.admin_notifications for select to authenticated
  using ((select private.is_admin()));

create policy admin_notifications_admin_update
  on public.admin_notifications for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create table if not exists public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  event_key text not null unique check (length(trim(event_key)) between 1 and 200),
  order_id uuid references public.orders(id) on delete cascade,
  channel text not null check (channel in ('web_push', 'email')),
  status text not null default 'pending' check (status in ('pending', 'processing', 'sent', 'failed')),
  attempts smallint not null default 0 check (attempts >= 0),
  last_error text,
  next_retry_at timestamptz not null default now(),
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notification_outbox_pending_idx
  on public.notification_outbox (status, next_retry_at)
  where status in ('pending', 'processing');

alter table public.notification_outbox enable row level security;
revoke all on public.notification_outbox from public, anon, authenticated;
grant select, insert, update on public.notification_outbox to service_role;
grant select on public.notification_outbox to authenticated;

create policy notification_outbox_admin_read
  on public.notification_outbox for select to authenticated
  using ((select private.is_admin()));

-- =============================================================================
-- 7. Update place_order to apply highest qualifying tier (2->10%, 3+->20%)
--    and write durable admin_notifications + notification_outbox records
-- =============================================================================
create or replace function public.place_order(
  order_id uuid,
  customer text,
  customer_phone text,
  delivery_address text,
  region text,
  order_notes text,
  books_12 smallint,
  books_24 smallint,
  photo text
) returns uuid
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  v_order_id uuid;
  v_ref text;
begin
  with best_discount as (
    select coalesce(max(d.percent), 0)::smallint as percent
    from public.discount_rules d
    where d.active = true
      and d.book_count <= (books_12 + books_24)
      and (d.starts_at is null or d.starts_at <= now())
      and (d.ends_at is null or d.ends_at >= now())
  ),
  created as (
    insert into public.orders (
      id,
      customer_name,
      phone,
      address,
      governorate,
      notes,
      count_12,
      count_24,
      price_12,
      price_24,
      discount_percent,
      shipping_piastres,
      photo_path
    )
    select
      order_id,
      customer,
      customer_phone,
      delivery_address,
      region,
      order_notes,
      books_12,
      books_24,
      a.price_piastres,
      b.price_piastres,
      bd.percent,
      s.fee_piastres,
      photo
    from public.book_prices a
    cross join public.book_prices b
    cross join best_discount bd
    join public.shipping_rates s on s.code = region
    where a.pages = 12 and b.pages = 24
    returning id, reference
  )
  select id, reference into v_order_id, v_ref from created;

  insert into public.notification_jobs (order_id)
  values (v_order_id)
  on conflict (order_id) do nothing;

  insert into public.admin_notifications (order_id, type, title_ar, title_en)
  values (
    v_order_id,
    'new_order',
    'طلب كتاب جديد رقم ' || v_ref,
    'New book request #' || v_ref
  );

  insert into public.notification_outbox (event_key, order_id, channel)
  values
    ('order_created:' || v_order_id::text || ':web_push', v_order_id, 'web_push'),
    ('order_created:' || v_order_id::text || ':email', v_order_id, 'email')
  on conflict (event_key) do nothing;

  return v_order_id;
end;
$$;

revoke all on function public.place_order(uuid, text, text, text, text, text, smallint, smallint, text) from public, anon, authenticated;
grant execute on function public.place_order(uuid, text, text, text, text, text, smallint, smallint, text) to service_role;

commit;
