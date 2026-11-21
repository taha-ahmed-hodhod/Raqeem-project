alter table public.orders
  add column if not exists total_count_12 smallint not null default 0 check (total_count_12 between 0 and 100),
  add column if not exists total_count_24 smallint not null default 0 check (total_count_24 between 0 and 100),
  add column if not exists books_subtotal_piastres integer not null default 0 check (books_subtotal_piastres >= 0),
  add column if not exists books_discount_piastres integer not null default 0 check (books_discount_piastres >= 0),
  add column if not exists books_total_piastres integer not null default 0 check (books_total_piastres >= 0);

create policy child_photo_scoped_upload
  on storage.objects for insert to anon, authenticated
  with check (
    bucket_id = 'child-photos'
    and name ~ '^orders/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$'
  );

create or replace function private.log_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and (
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

create or replace function public.submit_order_request(
  p_idempotency_key text,
  p_customer_name text,
  p_phone text,
  p_whatsapp_phone text,
  p_governorate text,
  p_address text,
  p_notes text,
  p_consent_accepted boolean,
  p_items jsonb
) returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_existing_id uuid;
  v_existing_ref text;
  v_existing_subtotal integer;
  v_existing_discount integer;
  v_existing_books_total integer;
  v_existing_shipping integer;
  v_existing_discount_pct smallint;
  v_price_12 integer;
  v_price_24 integer;
  v_shipping_fee integer;
  v_total_12 integer := 0;
  v_total_24 integer := 0;
  v_total_books integer := 0;
  v_legacy_12 smallint := 0;
  v_legacy_24 smallint := 0;
  v_discount_percent smallint := 0;
  v_subtotal_piastres integer := 0;
  v_discount_piastres integer := 0;
  v_books_total_piastres integer := 0;
  v_order_id uuid;
  v_reference text;
  v_item jsonb;
  v_idx smallint := 0;
  v_page_count smallint;
  v_qty smallint;
  v_unit_price integer;
begin
  if p_consent_accepted is distinct from true then
    raise exception 'guardian_consent_required';
  end if;

  if p_idempotency_key is null or length(trim(p_idempotency_key)) < 8 then
    raise exception 'invalid_idempotency_key';
  end if;

  -- 1. Idempotency check: return existing order if already submitted
  select
    o.id,
    o.reference,
    o.books_subtotal_piastres,
    o.books_discount_piastres,
    o.books_total_piastres,
    o.shipping_piastres,
    o.discount_percent
  into
    v_existing_id,
    v_existing_ref,
    v_existing_subtotal,
    v_existing_discount,
    v_existing_books_total,
    v_existing_shipping,
    v_existing_discount_pct
  from public.orders o
  where o.idempotency_key = trim(p_idempotency_key)
  limit 1;

  if v_existing_id is not null then
    return jsonb_build_object(
      'order_id', v_existing_id,
      'reference', v_existing_ref,
      'deduplicated', true,
      'subtotal_piastres', v_existing_subtotal,
      'discount_percent', v_existing_discount_pct,
      'discount_piastres', v_existing_discount,
      'books_total_piastres', v_existing_books_total,
      'shipping_piastres', v_existing_shipping
    );
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 20 then
    raise exception 'invalid_order_items';
  end if;

  -- 2. Load current active book prices
  select price_piastres into v_price_12 from public.book_prices where pages = 12;
  select price_piastres into v_price_24 from public.book_prices where pages = 24;

  if v_price_12 is null or v_price_24 is null then
    raise exception 'book_prices_not_configured';
  end if;

  -- 3. Validate governorate & load nullable shipping rate
  select fee_piastres into v_shipping_fee
  from public.shipping_rates
  where code = trim(p_governorate) and active = true;

  if not found then
    raise exception 'invalid_governorate';
  end if;

  -- 4. Sum total 12-page and 24-page quantities across all items
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_page_count := (v_item->>'page_count')::smallint;
    v_qty := coalesce((v_item->>'quantity')::smallint, 1);

    if v_page_count not in (12, 24) or v_qty < 1 or v_qty > 20 then
      raise exception 'invalid_item_configuration';
    end if;

    if v_page_count = 12 then
      v_total_12 := v_total_12 + v_qty;
    else
      v_total_24 := v_total_24 + v_qty;
    end if;
  end loop;

  v_total_books := v_total_12 + v_total_24;
  if v_total_books < 1 or v_total_books > 100 then
    raise exception 'invalid_total_books';
  end if;

  -- Keep legacy count_12/count_24 columns within 1..3 check constraint while storing full totals in total_count_12/24
  v_legacy_12 := least(v_total_12, 3)::smallint;
  v_legacy_24 := least(v_total_24, 3 - v_legacy_12)::smallint;
  if (v_legacy_12 + v_legacy_24) < 1 then
    v_legacy_12 := 1;
  end if;

  -- 5. Find single highest qualifying active discount tier (no stacking, shipping excluded)
  select coalesce(max(d.percent), 0)::smallint
  into v_discount_percent
  from public.discount_rules d
  where d.active = true
    and d.book_count <= v_total_books
    and (d.starts_at is null or d.starts_at <= now())
    and (d.ends_at is null or d.ends_at >= now());

  -- 6. Compute exact integer piastres
  v_subtotal_piastres := (v_total_12 * v_price_12) + (v_total_24 * v_price_24);
  v_discount_piastres := ((v_discount_percent::bigint * v_subtotal_piastres + 50) / 100)::integer;
  v_books_total_piastres := v_subtotal_piastres - v_discount_piastres;

  -- 7. Insert order with pricing snapshot
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
    (p_items->0->>'photo_path'),
    'new',
    'new',
    true,
    now(),
    trim(p_idempotency_key)
  )
  returning id, reference into v_order_id, v_reference;

  -- Record initial 'new' lifecycle event AFTER order row exists
  insert into public.order_status_events (order_id, old_status, new_status, actor_user_id)
  values (v_order_id, null, 'new', null);

  -- 8. Insert each child's personalized book row into order_items
  v_idx := 0;
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_page_count := (v_item->>'page_count')::smallint;
    v_qty := coalesce((v_item->>'quantity')::smallint, 1);
    v_unit_price := case when v_page_count = 12 then v_price_12 else v_price_24 end;

    insert into public.order_items (
      order_id,
      item_index,
      page_count,
      quantity,
      child_name,
      child_age,
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
      (v_item->>'child_age')::smallint,
      nullif(trim(coalesce(v_item->>'interests', '')), ''),
      nullif(trim(coalesce(v_item->>'notes', '')), ''),
      trim(v_item->>'photo_path'),
      v_unit_price
    );

    v_idx := v_idx + 1;
  end loop;

  -- 9. Durable notifications & outbox records (no child PII in notification titles)
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
    'shipping_piastres', v_shipping_fee
  );
end;
$$;

grant execute on function public.submit_order_request(text, text, text, text, text, text, text, boolean, jsonb)
  to anon, authenticated, service_role;
