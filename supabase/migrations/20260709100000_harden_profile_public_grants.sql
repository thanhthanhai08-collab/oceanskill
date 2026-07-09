-- Keep reviewer profile metadata public without exposing profile.email through
-- direct Supabase client queries against public reviewer rows.
revoke select on public.profiles from authenticated;

grant select (id, display_name, avatar_url) on public.profiles to anon, authenticated;
grant update (display_name, avatar_url) on public.profiles to authenticated;

create or replace function public.get_own_profile()
returns table(id uuid, email text, display_name text, avatar_url text)
language sql
security definer
set search_path = ''
as $$
  select p.id, p.email, p.display_name, p.avatar_url
  from public.profiles p
  where p.id = (select auth.uid());
$$;

revoke all on function public.get_own_profile() from public, anon, authenticated;
grant execute on function public.get_own_profile() to authenticated;
