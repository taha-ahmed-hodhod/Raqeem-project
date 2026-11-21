-- Enable Supabase Realtime on public.site_settings (for instant public CMS live sync)
-- and public.orders (for instant admin new-order toast, strictly protected by RLS).
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.site_settings;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Seed a zero-PII live sync tick row in public.site_settings
INSERT INTO public.site_settings (key, value, updated_at)
VALUES ('cms_live_tick', jsonb_build_object('ts', extract(epoch from now()), 'source', 'init'), now())
ON CONFLICT (key) DO NOTHING;

-- Trigger function: whenever any admin-managed CMS table changes (INSERT, UPDATE, or DELETE),
-- bump cms_live_tick in public.site_settings so all open public tabs receive a single
-- lightweight, zero-PII Realtime event and call router.refresh() seamlessly.
CREATE OR REPLACE FUNCTION private.bump_cms_live_tick()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.site_settings (key, value, updated_at)
  VALUES (
    'cms_live_tick',
    jsonb_build_object('ts', extract(epoch from clock_timestamp()), 'source', TG_TABLE_NAME),
    now()
  )
  ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value,
      updated_at = EXCLUDED.updated_at;
  RETURN NULL;
END;
$$;

-- Attach idempotent statement-level triggers (fires once per SQL statement, never spams)
DO $$
DECLARE
  tbl text;
  trig_name text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'book_prices',
    'discount_rules',
    'shipping_rates',
    'site_content',
    'portfolio',
    'customer_reviews',
    'social_links'
  ]
  LOOP
    trig_name := 'trg_' || tbl || '_cms_live_tick';
    IF NOT EXISTS (
      SELECT 1
      FROM pg_trigger
      WHERE tgname = trig_name
        AND tgrelid = ('public.' || tbl)::regclass
    ) THEN
      EXECUTE format(
        'CREATE TRIGGER %I AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH STATEMENT EXECUTE FUNCTION private.bump_cms_live_tick()',
        trig_name,
        tbl
      );
    END IF;
  END LOOP;
END $$;
