-- Atomic, monotonic sequence for deterministic sequential review avatars:
-- 0 = Astronaut, 1 = Girl with Bow, 2 = Boy with Glasses, 3 -> 0 = Astronaut, ...
-- Assigned once at creation and never recalculated when reviews are hidden, edited, or deleted.
CREATE SEQUENCE IF NOT EXISTS public.customer_reviews_avatar_seq START WITH 1 INCREMENT BY 1;

-- Backfill any legacy rows that lack a valid avatar_index (0, 1, or 2) in chronological order
WITH missing AS (
  SELECT id, row_number() OVER (ORDER BY created_at ASC, id ASC) - 1 AS rn
  FROM public.customer_reviews
  WHERE avatar_index IS NULL OR avatar_index NOT IN (0, 1, 2)
)
UPDATE public.customer_reviews r
SET avatar_index = (missing.rn % 3)::smallint
FROM missing
WHERE r.id = missing.id;

-- Sync sequence to current total row count so next insert gets (count % 3)
SELECT setval(
  'public.customer_reviews_avatar_seq',
  GREATEST((SELECT COUNT(*) FROM public.customer_reviews), 1),
  (SELECT COUNT(*) > 0 FROM public.customer_reviews)
);

-- Set column default so every new review automatically receives the next sequential avatar once
ALTER TABLE public.customer_reviews
  ALTER COLUMN avatar_index
  SET DEFAULT (((nextval('public.customer_reviews_avatar_seq') - 1) % 3)::smallint);
