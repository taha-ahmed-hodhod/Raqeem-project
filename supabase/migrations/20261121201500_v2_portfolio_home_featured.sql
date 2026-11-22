-- Add homepage selection and ordering controls to public.portfolio
ALTER TABLE public.portfolio
  ADD COLUMN IF NOT EXISTS show_on_home boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS home_sort_order smallint NOT NULL DEFAULT 0;

-- Enforce server-side maximum of 4 items selected for Homepage ("عرض في الرئيسية")
CREATE OR REPLACE FUNCTION private.enforce_portfolio_home_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  selected_count integer;
BEGIN
  IF NEW.show_on_home IS TRUE THEN
    SELECT COUNT(*)
    INTO selected_count
    FROM public.portfolio
    WHERE show_on_home IS TRUE
      AND id <> NEW.id;

    IF selected_count >= 4 THEN
      RAISE EXCEPTION 'MAX_HOME_PORTFOLIO_REACHED: يمكن اختيار 4 كتب كحد أقصى للعرض في الصفحة الرئيسية.'
        USING ERRCODE = 'P0001';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trg_portfolio_home_limit'
      AND tgrelid = 'public.portfolio'::regclass
  ) THEN
    CREATE TRIGGER trg_portfolio_home_limit
      BEFORE INSERT OR UPDATE OF show_on_home ON public.portfolio
      FOR EACH ROW
      EXECUTE FUNCTION private.enforce_portfolio_home_limit();
  END IF;
END $$;

-- Update public.portfolio_entries view to expose show_on_home and home_sort_order
CREATE OR REPLACE VIEW public.portfolio_entries
WITH (security_invoker = true) AS
SELECT
  id,
  slug,
  title,
  COALESCE(title_ar, title) AS title_ar,
  COALESCE(title_en, title) AS title_en,
  description_ar,
  description_en,
  image_url,
  cartoon_image_url,
  coloring_page_url,
  book_mockup_url,
  kind,
  kind = 'sample'::text AS is_demo,
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
  story_hero_en,
  show_on_home,
  home_sort_order
FROM public.portfolio;
