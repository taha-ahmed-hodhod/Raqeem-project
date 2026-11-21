-- =============================================================================
-- Raqeem | رقيم — v2 Expansion Schema (Phases 2, 4, 5, 6, 7)
-- Purely additive migration preserving all existing orders and CMS content.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Phase 2: Public `site-media` bucket (strictly separated from `child-photos`)
--    + Portfolio Case Study fields
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-media', 'site-media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'site_media_public_read'
  ) then
    create policy site_media_public_read
      on storage.objects for select to anon, authenticated
      using (bucket_id = 'site-media');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'site_media_admin_write'
  ) then
    create policy site_media_admin_write
      on storage.objects for insert to authenticated
      with check (bucket_id = 'site-media' and (select private.is_admin()));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'site_media_admin_update'
  ) then
    create policy site_media_admin_update
      on storage.objects for update to authenticated
      using (bucket_id = 'site-media' and (select private.is_admin()))
      with check (bucket_id = 'site-media' and (select private.is_admin()));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'site_media_admin_delete'
  ) then
    create policy site_media_admin_delete
      on storage.objects for delete to authenticated
      using (bucket_id = 'site-media' and (select private.is_admin()));
  end if;
end
$$;

alter table public.portfolio
  add column if not exists short_summary_ar text check (short_summary_ar is null or length(short_summary_ar) <= 400),
  add column if not exists short_summary_en text check (short_summary_en is null or length(short_summary_en) <= 400),
  add column if not exists story_interests_ar text check (story_interests_ar is null or length(story_interests_ar) <= 1000),
  add column if not exists story_interests_en text check (story_interests_en is null or length(story_interests_en) <= 1000),
  add column if not exists story_idea_ar text check (story_idea_ar is null or length(story_idea_ar) <= 1000),
  add column if not exists story_idea_en text check (story_idea_en is null or length(story_idea_en) <= 1000),
  add column if not exists story_hero_ar text check (story_hero_ar is null or length(story_hero_ar) <= 1000),
  add column if not exists story_hero_en text check (story_hero_en is null or length(story_hero_en) <= 1000);

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
  created_at,
  short_summary_ar,
  short_summary_en,
  story_interests_ar,
  story_interests_en,
  story_idea_ar,
  story_idea_en,
  story_hero_ar,
  story_hero_en
from public.portfolio;

grant select on public.portfolio_entries to anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 2. Phase 4: Deposit selection & manual receipt confirmation + Adult age label
-- -----------------------------------------------------------------------------
alter table public.orders
  add column if not exists deposit_selected_piastres integer check (
    deposit_selected_piastres is null or deposit_selected_piastres in (10000, 20000, 30000)
  ),
  add column if not exists deposit_status text not null default 'not_specified' check (
    deposit_status in ('not_specified', 'pending', 'received')
  ),
  add column if not exists deposit_received_at timestamptz;

grant update(deposit_status, deposit_received_at) on public.orders to authenticated;

alter table public.order_items
  add column if not exists age_label text check (age_label is null or length(age_label) <= 60);

-- Overload / v2 RPC supporting deposit_selected_piastres and age_label
create or replace function public.submit_order_request_v2(
  p_idempotency_key text,
  p_customer_name text,
  p_phone text,
  p_whatsapp_phone text,
  p_governorate text,
  p_address text,
  p_notes text,
  p_consent_accepted boolean,
  p_deposit_selected_piastres integer,
  p_items jsonb
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_existing public.orders%rowtype;
  v_item jsonb;
  v_total_12 integer := 0;
  v_total_24 integer := 0;
  v_total_books integer := 0;
  v_legacy_12 smallint := 0;
  v_legacy_24 smallint := 0;
  v_price_12 integer;
  v_price_24 integer;
  v_shipping_fee integer;
  v_discount_percent smallint := 0;
  v_subtotal_piastres integer := 0;
  v_discount_piastres integer := 0;
  v_books_total_piastres integer := 0;
  v_deposit_status text := 'not_specified';
  v_order_id uuid;
  v_reference text;
  v_idx smallint := 0;
  v_page_count smallint;
  v_qty smallint;
  v_unit_price integer;
  v_age_num integer;
  v_age_label text;
begin
  if p_consent_accepted is distinct from true then
    raise exception 'consent_required';
  end if;

  if p_idempotency_key is null or length(trim(p_idempotency_key)) < 8 then
    raise exception 'invalid_idempotency_key';
  end if;

  if p_deposit_selected_piastres is not null
     and p_deposit_selected_piastres not in (10000, 20000, 30000) then
    raise exception 'invalid_deposit_amount';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1 then
    raise exception 'items_required';
  end if;

  select * into v_existing
  from public.orders
  where idempotency_key = trim(p_idempotency_key)
  limit 1;

  if found then
    return jsonb_build_object(
      'order_id', v_existing.id,
      'reference', v_existing.reference,
      'deduplicated', true,
      'subtotal_piastres', coalesce(v_existing.books_subtotal_piastres, v_existing.subtotal_piastres),
      'discount_percent', v_existing.discount_percent,
      'discount_piastres', coalesce(v_existing.books_discount_piastres, v_existing.discount_piastres),
      'books_total_piastres', coalesce(v_existing.books_total_piastres, v_existing.subtotal_piastres - v_existing.discount_piastres),
      'shipping_piastres', v_existing.shipping_piastres,
      'deposit_selected_piastres', v_existing.deposit_selected_piastres,
      'deposit_status', v_existing.deposit_status
    );
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_page_count := (v_item->>'page_count')::smallint;
    v_qty := coalesce((v_item->>'quantity')::smallint, 1);

    if v_page_count not in (12, 24) then
      raise exception 'invalid_page_count';
    end if;
    if v_qty < 1 or v_qty > 20 then
      raise exception 'invalid_quantity';
    end if;

    if v_page_count = 12 then
      v_total_12 := v_total_12 + v_qty;
    else
      v_total_24 := v_total_24 + v_qty;
    end if;
  end loop;

  v_total_books := v_total_12 + v_total_24;
  if v_total_books < 1 then
    raise exception 'items_required';
  end if;

  if v_total_books <= 3 then
    v_legacy_12 := v_total_12::smallint;
    v_legacy_24 := v_total_24::smallint;
  else
    v_legacy_12 := least(v_total_12, 3)::smallint;
    v_legacy_24 := least(v_total_24, 3 - v_legacy_12)::smallint;
  end if;

  select price_piastres into v_price_12 from public.book_prices where pages = 12;
  select price_piastres into v_price_24 from public.book_prices where pages = 24;

  if v_price_12 is null or v_price_24 is null then
    raise exception 'book_prices_missing';
  end if;

  select fee_piastres into v_shipping_fee
  from public.shipping_rates
  where code = trim(p_governorate);

  if not found then
    raise exception 'invalid_governorate';
  end if;

  select coalesce(max(d.percent), 0)::smallint
  into v_discount_percent
  from public.discount_rules d
  where d.active = true
    and d.book_count <= v_total_books
    and (d.starts_at is null or d.starts_at <= now())
    and (d.ends_at is null or d.ends_at >= now());

  v_subtotal_piastres := (v_total_12 * v_price_12) + (v_total_24 * v_price_24);
  v_discount_piastres := ((v_discount_percent::bigint * v_subtotal_piastres + 50) / 100)::integer;
  v_books_total_piastres := v_subtotal_piastres - v_discount_piastres;

  -- Reject negative remaining balance: selected deposit must not exceed books total
  if p_deposit_selected_piastres is not null then
    if p_deposit_selected_piastres > v_books_total_piastres then
      raise exception 'deposit_exceeds_order_total';
    end if;
    v_deposit_status := 'pending';
  end if;

  insert into public.orders (
    customer_name,
    phone,
    whatsapp_phone,
    address,
    governorate,
    notes,
    count_12,
    count_24,
    total_count_12,
    total_count_24,
    price_12,
    price_24,
    discount_percent,
    shipping_piastres,
    books_subtotal_piastres,
    books_discount_piastres,
    books_total_piastres,
    deposit_selected_piastres,
    deposit_status,
    photo_path,
    status,
    lifecycle_stage,
    consent_accepted,
    consent_at,
    idempotency_key
  )
  values (
    trim(p_customer_name),
    trim(p_phone),
    nullif(trim(coalesce(p_whatsapp_phone, '')), ''),
    trim(p_address),
    trim(p_governorate),
    nullif(trim(coalesce(p_notes, '')), ''),
    v_legacy_12,
    v_legacy_24,
    v_total_12::smallint,
    v_total_24::smallint,
    v_price_12,
    v_price_24,
    v_discount_percent,
    v_shipping_fee,
    v_subtotal_piastres,
    v_discount_piastres,
    v_books_total_piastres,
    p_deposit_selected_piastres,
    v_deposit_status,
    (p_items->0->>'photo_path'),
    'new',
    'new',
    true,
    now(),
    trim(p_idempotency_key)
  )
  returning id, reference into v_order_id, v_reference;

  insert into public.order_status_events (order_id, old_status, new_status, actor_user_id)
  values (v_order_id, null, 'new', null);

  v_idx := 0;
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_page_count := (v_item->>'page_count')::smallint;
    v_qty := coalesce((v_item->>'quantity')::smallint, 1);
    v_unit_price := case when v_page_count = 12 then v_price_12 else v_price_24 end;
    v_age_num := least(greatest(coalesce((v_item->>'child_age')::integer, 18), 1), 18);
    v_age_label := nullif(trim(coalesce(v_item->>'age_label', '')), '');

    insert into public.order_items (
      order_id,
      item_index,
      page_count,
      quantity,
      child_name,
      child_age,
      age_label,
      interests,
      notes,
      photo_path,
      unit_price_piastres
    )
    values (
      v_order_id,
      v_idx,
      v_page_count,
      v_qty,
      trim(v_item->>'child_name'),
      v_age_num::smallint,
      v_age_label,
      nullif(trim(coalesce(v_item->>'interests', '')), ''),
      nullif(trim(coalesce(v_item->>'notes', '')), ''),
      trim(v_item->>'photo_path'),
      v_unit_price
    );

    v_idx := v_idx + 1;
  end loop;

  insert into public.notification_jobs (order_id)
  values (v_order_id)
  on conflict (order_id) do nothing;

  insert into public.admin_notifications (order_id, type, title_ar, title_en)
  values (
    v_order_id,
    'new_order',
    'طلب كتاب جديد رقم ' || v_reference,
    'New book request #' || v_reference
  );

  insert into public.notification_outbox (event_key, order_id, channel)
  values
    ('order_created:' || v_order_id::text || ':web_push', v_order_id, 'web_push'),
    ('order_created:' || v_order_id::text || ':email', v_order_id, 'email')
  on conflict (event_key) do nothing;

  return jsonb_build_object(
    'order_id', v_order_id,
    'reference', v_reference,
    'deduplicated', false,
    'subtotal_piastres', v_subtotal_piastres,
    'discount_percent', v_discount_percent,
    'discount_piastres', v_discount_piastres,
    'books_total_piastres', v_books_total_piastres,
    'shipping_piastres', v_shipping_fee,
    'deposit_selected_piastres', p_deposit_selected_piastres,
    'deposit_status', v_deposit_status
  );
end;
$$;

grant execute on function public.submit_order_request_v2(text, text, text, text, text, text, text, boolean, integer, jsonb)
  to anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 3. Phase 5: Customer Reviews with Admin Moderation & Sequential Avatars
-- -----------------------------------------------------------------------------
create table if not exists public.customer_reviews (
  id uuid primary key default gen_random_uuid(),
  reviewer_name text not null check (length(trim(reviewer_name)) between 2 and 80),
  reviewer_age text not null check (length(trim(reviewer_age)) between 1 and 40),
  rating smallint not null check (rating between 1 and 5),
  comment text not null check (length(trim(comment)) between 5 and 800),
  avatar_index smallint not null default 0 check (avatar_index between 0 and 2),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'hidden')),
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

create index if not exists customer_reviews_status_idx
  on public.customer_reviews (status, created_at desc);

alter table public.customer_reviews enable row level security;
revoke all on public.customer_reviews from public, anon, authenticated;
grant select, insert, update, delete on public.customer_reviews to service_role;
grant select, insert on public.customer_reviews to anon;
grant select, insert, update, delete on public.customer_reviews to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'customer_reviews' and policyname = 'reviews_public_read_approved'
  ) then
    create policy reviews_public_read_approved
      on public.customer_reviews for select to anon, authenticated
      using (status = 'approved' or (select private.is_admin()));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'customer_reviews' and policyname = 'reviews_public_insert_pending'
  ) then
    create policy reviews_public_insert_pending
      on public.customer_reviews for insert to anon, authenticated
      with check (status = 'pending' and approved_at is null);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'customer_reviews' and policyname = 'reviews_admin_update'
  ) then
    create policy reviews_admin_update
      on public.customer_reviews for update to authenticated
      using ((select private.is_admin()))
      with check ((select private.is_admin()));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'customer_reviews' and policyname = 'reviews_admin_delete'
  ) then
    create policy reviews_admin_delete
      on public.customer_reviews for delete to authenticated
      using ((select private.is_admin()));
  end if;
end
$$;

-- Seed initial approved reviews only if table is empty
insert into public.customer_reviews (reviewer_name, reviewer_age, rating, comment, avatar_index, status, approved_at)
select * from (values
  ('أم ياسين', '5 سنوات', 5::smallint, 'الفكرة رائعة والكتاب طلع أجمل من المتوقع. ابني كان سعيد جداً وشعر إنه بطل القصة فعلاً.. 💜', 0::smallint, 'approved', now()),
  ('أم مريم', '4 سنوات', 5::smallint, 'أول مرة بنتي تفضل ماسكة ألوان ومركزة بالساعات ومبسوطة بشكل مش طبيعي، جودة الورق والطباعة فوق الممتازة بجد!', 1::smallint, 'approved', now()),
  ('أم عمر', '6 سنوات', 5::smallint, 'هدية عيد ميلاد كانت مختلفة ومميزة جداً، فرحة ابني لما شاف اسمه وصورته على الغلاف ورسومات القصة تسوى الدنيا.. شكراً رقيم 🌟', 2::smallint, 'approved', now())
) as v(reviewer_name, reviewer_age, rating, comment, avatar_index, status, approved_at)
where not exists (select 1 from public.customer_reviews limit 1);

-- -----------------------------------------------------------------------------
-- 4. Phase 6: Social Media Links CMS
-- -----------------------------------------------------------------------------
create table if not exists public.social_links (
  id uuid primary key default gen_random_uuid(),
  platform text not null unique check (length(trim(platform)) between 2 and 40),
  label_ar text not null check (length(trim(label_ar)) between 2 and 60),
  label_en text not null check (length(trim(label_en)) between 2 and 60),
  icon_key text not null check (icon_key in ('whatsapp', 'facebook', 'instagram', 'tiktok', 'youtube', 'globe')),
  url text check (url is null or (length(url) <= 500 and url ~ '^https?://')),
  active boolean not null default false,
  sort_order smallint not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.social_links enable row level security;
revoke all on public.social_links from public, anon, authenticated;
grant select, insert, update, delete on public.social_links to service_role;
grant select on public.social_links to anon;
grant select, insert, update, delete on public.social_links to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'social_links' and policyname = 'social_links_public_read'
  ) then
    create policy social_links_public_read
      on public.social_links for select to anon, authenticated
      using ((active = true and url is not null) or (select private.is_admin()));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'social_links' and policyname = 'social_links_admin_all'
  ) then
    create policy social_links_admin_all
      on public.social_links for all to authenticated
      using ((select private.is_admin()))
      with check ((select private.is_admin()));
  end if;
end
$$;

insert into public.social_links (platform, label_ar, label_en, icon_key, url, active, sort_order)
values
  ('whatsapp', 'واتساب', 'WhatsApp', 'whatsapp', 'https://wa.me/201038639918', true, 1),
  ('facebook', 'فيسبوك', 'Facebook', 'facebook', null, false, 2),
  ('instagram', 'إنستجرام', 'Instagram', 'instagram', null, false, 3),
  ('tiktok', 'تيك توك', 'TikTok', 'tiktok', null, false, 4)
on conflict (platform) do nothing;

-- -----------------------------------------------------------------------------
-- 5. Phase 7: Non-PII Public Order Tracking RPC
-- -----------------------------------------------------------------------------
create or replace function public.lookup_order_tracking_status(p_reference text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_clean text;
  v_row record;
begin
  v_clean := upper(trim(coalesce(p_reference, '')));
  if v_clean = '' or length(v_clean) < 6 or length(v_clean) > 32 then
    return jsonb_build_object('found', false);
  end if;

  select reference, lifecycle_stage, status, created_at, updated_at
  into v_row
  from public.orders
  where upper(reference) = v_clean
  limit 1;

  if not found then
    return jsonb_build_object('found', false);
  end if;

  -- Strictly non-PII response: no names, phones, addresses, photos, or financials
  return jsonb_build_object(
    'found', true,
    'reference', v_row.reference,
    'lifecycle_stage', coalesce(v_row.lifecycle_stage, v_row.status, 'new'),
    'status', v_row.status,
    'created_at', v_row.created_at,
    'updated_at', coalesce(v_row.updated_at, v_row.created_at)
  );
end;
$$;

grant execute on function public.lookup_order_tracking_status(text)
  to anon, authenticated, service_role;
