-- Phase 7 enhancement: Return strictly masked customer first name & masked phone
-- from public.lookup_order_tracking_status so raw PII never leaves Postgres.

create or replace function public.lookup_order_tracking_status(p_reference text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_clean text;
  v_row record;
  v_name_parts text[];
  v_masked_name text;
  v_digits text;
  v_masked_phone text;
begin
  v_clean := upper(trim(coalesce(p_reference, '')));
  if v_clean = '' or length(v_clean) < 6 or length(v_clean) > 32 then
    return jsonb_build_object('found', false);
  end if;

  select reference, lifecycle_stage, status, created_at, updated_at, customer_name, phone
  into v_row
  from public.orders
  where upper(reference) = v_clean
  limit 1;

  if not found then
    return jsonb_build_object('found', false);
  end if;

  -- Mask customer name inside Postgres (e.g. "أحمد محمود" -> "أحمد م***", "محمد" -> "مح***")
  v_name_parts := regexp_split_to_array(trim(coalesce(v_row.customer_name, '')), '\s+');
  if array_length(v_name_parts, 1) >= 2 then
    v_masked_name := v_name_parts[1] || ' ' || left(v_name_parts[2], 1) || '***';
  elsif length(coalesce(v_name_parts[1], '')) > 2 then
    v_masked_name := left(v_name_parts[1], 2) || '***';
  else
    v_masked_name := coalesce(v_name_parts[1], '') || '***';
  end if;

  -- Mask phone inside Postgres (e.g. "01012345678" -> "010****5678")
  v_digits := regexp_replace(coalesce(v_row.phone, ''), '\D', '', 'g');
  if length(v_digits) >= 7 then
    v_masked_phone := left(v_digits, 3) || '****' || right(v_digits, 4);
  else
    v_masked_phone := '****';
  end if;

  return jsonb_build_object(
    'found', true,
    'reference', v_row.reference,
    'lifecycle_stage', coalesce(v_row.lifecycle_stage, v_row.status, 'new'),
    'status', v_row.status,
    'created_at', v_row.created_at,
    'updated_at', coalesce(v_row.updated_at, v_row.created_at),
    'masked_customer_name', v_masked_name,
    'masked_phone', v_masked_phone
  );
end;
$$;

grant execute on function public.lookup_order_tracking_status(text)
  to anon, authenticated, service_role;
