-- Fix anon SELECT policies on customer_reviews and social_links:
-- anon must NEVER evaluate private.is_admin() (which is restricted to authenticated).

alter policy reviews_public_read_approved
  on public.customer_reviews
  to authenticated
  using (status = 'approved' or (select private.is_admin()));

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'customer_reviews' and policyname = 'reviews_anon_read_approved'
  ) then
    create policy reviews_anon_read_approved
      on public.customer_reviews for select to anon
      using (status = 'approved');
  end if;
end
$$;

alter policy social_links_public_read
  on public.social_links
  to authenticated
  using ((active = true and url is not null) or (select private.is_admin()));

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'social_links' and policyname = 'social_links_anon_read_active'
  ) then
    create policy social_links_anon_read_active
      on public.social_links for select to anon
      using (active = true and url is not null);
  end if;
end
$$;
