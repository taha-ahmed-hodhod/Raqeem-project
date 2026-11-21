-- M5: Notifications & PWA additive enhancements
-- 1. Allow the single allowlisted admin to update notification_outbox for manual retry/dispatch.
-- 2. Track device metadata (user_agent, created_at) on push_subscriptions.

grant update on public.notification_outbox to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'notification_outbox'
      and policyname = 'notification_outbox_admin_update'
  ) then
    create policy notification_outbox_admin_update
      on public.notification_outbox for update to authenticated
      using ((select private.is_admin()))
      with check ((select private.is_admin()));
  end if;
end
$$;

alter table public.push_subscriptions
  add column if not exists user_agent text check (user_agent is null or length(user_agent) <= 400),
  add column if not exists created_at timestamptz not null default now();
