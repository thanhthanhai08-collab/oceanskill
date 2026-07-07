create table if not exists public.mcp_call_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  api_key_id uuid not null references public.api_keys(id) on delete cascade,
  tool_name text not null check (tool_name in (
    'list_purchased_skills',
    'search_skills',
    'get_skill_content',
    'list_collections',
    'add_collection_to_library',
    'toggle_skill',
    'get_usage_summary'
  )),
  request_id text,
  created_at timestamptz not null default now()
);

create index if not exists mcp_call_events_user_created_idx
  on public.mcp_call_events(user_id, created_at desc);

create index if not exists mcp_call_events_api_key_created_idx
  on public.mcp_call_events(api_key_id, created_at desc);

alter table public.mcp_call_events enable row level security;

drop policy if exists mcp_call_events_select_own on public.mcp_call_events;
create policy mcp_call_events_select_own on public.mcp_call_events for select
to authenticated
using ((select auth.uid()) = user_id);

revoke all on public.mcp_call_events from anon, authenticated;
grant select on public.mcp_call_events to authenticated;
grant insert on public.mcp_call_events to service_role;
