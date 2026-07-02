create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.skills (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 1 and 160),
  description text not null default '',
  domain text not null check (domain in ('agent-first','security','productivity','design','marketing','development','research')),
  status text not null default 'draft' check (status in ('draft','active','archived')),
  current_version text,
  compatible_clients text[] not null default '{}',
  source_url text,
  license_spdx text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.skill_versions (
  id uuid primary key default gen_random_uuid(),
  skill_id uuid not null references public.skills(id) on delete cascade,
  version text not null,
  content_md text not null,
  content_hash text not null,
  storage_path text,
  scan_status text not null default 'pending' check (scan_status in ('pending','passed','failed','review')),
  scan_summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (skill_id, version),
  unique (skill_id, content_hash)
);

alter table public.skills
  add constraint skills_current_version_fkey
  foreign key (id, current_version)
  references public.skill_versions(skill_id, version)
  deferrable initially deferred;

create table public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  key_prefix text not null check (char_length(key_prefix) between 8 and 24),
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table private.api_key_secrets (
  api_key_id uuid primary key references public.api_keys(id) on delete cascade,
  key_hash text not null unique,
  created_at timestamptz not null default now()
);

create table public.credit_packs (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z0-9_]+$'),
  name text not null,
  price_vnd bigint not null check (price_vnd > 0),
  credit_units bigint not null check (credit_units > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payment_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  pack_id uuid not null references public.credit_packs(id) on delete restrict,
  order_code text not null unique check (order_code ~ '^NSK[A-F0-9]{18}$'),
  provider text not null default 'sepay' check (provider = 'sepay'),
  provider_order_id text,
  amount_vnd bigint not null check (amount_vnd > 0),
  credit_units bigint not null check (credit_units > 0),
  status text not null default 'pending' check (status in ('pending','paid','expired','failed','refunded','review')),
  expires_at timestamptz not null,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index payment_orders_provider_order_id_uidx
  on public.payment_orders(provider, provider_order_id)
  where provider_order_id is not null;

create table public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  payment_order_id uuid references public.payment_orders(id) on delete restrict,
  provider text not null default 'sepay' check (provider = 'sepay'),
  provider_transaction_id text not null,
  reference_code text,
  transfer_type text not null check (transfer_type in ('in','out')),
  amount_vnd bigint not null check (amount_vnd > 0),
  transaction_at timestamptz not null,
  reconciliation_status text not null default 'matched' check (reconciliation_status in ('matched','duplicate','unmatched','partial','excess','review')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (provider, provider_transaction_id)
);

create table public.usage_events (
  id uuid primary key default gen_random_uuid(),
  request_id text not null unique,
  user_id uuid not null references public.profiles(id) on delete restrict,
  api_key_id uuid not null references public.api_keys(id) on delete restrict,
  skill_id uuid not null references public.skills(id) on delete restrict,
  skill_version_id uuid not null references public.skill_versions(id) on delete restrict,
  tool_name text not null check (tool_name in ('list_purchased_skills','get_skill_content','search_skills')),
  units bigint not null default 1 check (units > 0),
  status text not null default 'reserved' check (status in ('reserved','succeeded','failed')),
  error_code text,
  reserved_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.credit_ledger (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete restrict,
  units bigint not null check (units <> 0),
  entry_type text not null check (entry_type in ('trial','topup','usage','adjustment','refund','expiry')),
  idempotency_key text not null unique,
  payment_order_id uuid references public.payment_orders(id) on delete restrict,
  usage_event_id uuid references public.usage_events(id) on delete restrict,
  note text,
  created_at timestamptz not null default now(),
  check (
    (entry_type = 'usage' and units < 0 and usage_event_id is not null)
    or (entry_type <> 'usage')
  )
);

create index skill_versions_skill_id_idx on public.skill_versions(skill_id);
create index api_keys_user_id_idx on public.api_keys(user_id);
create index payment_orders_user_created_idx on public.payment_orders(user_id, created_at desc);
create index payment_orders_pending_idx on public.payment_orders(expires_at) where status = 'pending';
create index payment_transactions_order_id_idx on public.payment_transactions(payment_order_id);
create index usage_events_user_created_idx on public.usage_events(user_id, created_at desc);
create index usage_events_api_key_id_idx on public.usage_events(api_key_id);
create index usage_events_skill_id_idx on public.usage_events(skill_id);
create index usage_events_version_id_idx on public.usage_events(skill_version_id);
create index usage_events_reserved_user_idx on public.usage_events(user_id) where status = 'reserved';
create index credit_ledger_user_id_id_idx on public.credit_ledger(user_id, id desc);
create index credit_ledger_order_id_idx on public.credit_ledger(payment_order_id) where payment_order_id is not null;
create index credit_ledger_usage_id_idx on public.credit_ledger(usage_event_id) where usage_event_id is not null;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function private.set_updated_at();
create trigger skills_set_updated_at before update on public.skills
for each row execute function private.set_updated_at();
create trigger credit_packs_set_updated_at before update on public.credit_packs
for each row execute function private.set_updated_at();
create trigger payment_orders_set_updated_at before update on public.payment_orders
for each row execute function private.set_updated_at();

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles(id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  insert into public.credit_ledger(user_id, units, entry_type, idempotency_key, note)
  values (new.id, 50, 'trial', 'trial:' || new.id::text, 'Private beta trial credits')
  on conflict (idempotency_key) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

insert into public.profiles(id, email, display_name, avatar_url, created_at)
select id, email,
  coalesce(raw_user_meta_data ->> 'display_name', raw_user_meta_data ->> 'full_name'),
  raw_user_meta_data ->> 'avatar_url',
  created_at
from auth.users
on conflict (id) do nothing;

insert into public.credit_ledger(user_id, units, entry_type, idempotency_key, note)
select id, 50, 'trial', 'trial:' || id::text, 'Private beta trial credits'
from auth.users
on conflict (idempotency_key) do nothing;

-- migration-split: service-functions-and-policies
create or replace function public.create_sepay_payment_order(
  p_user_id uuid,
  p_pack_id uuid,
  p_expires_at timestamptz default (now() + interval '15 minutes')
)
returns public.payment_orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pack public.credit_packs%rowtype;
  v_order public.payment_orders%rowtype;
begin
  if p_expires_at <= now() or p_expires_at > now() + interval '24 hours' then
    raise exception 'invalid_expiration';
  end if;
  select * into v_pack from public.credit_packs where id = p_pack_id and active = true;
  if not found then raise exception 'credit_pack_not_found'; end if;
  if not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'profile_not_found';
  end if;

  insert into public.payment_orders(
    user_id, pack_id, order_code, amount_vnd, credit_units, expires_at
  ) values (
    p_user_id,
    v_pack.id,
    'NSK' || upper(encode(extensions.gen_random_bytes(9), 'hex')),
    v_pack.price_vnd,
    v_pack.credit_units,
    p_expires_at
  ) returning * into v_order;
  return v_order;
end;
$$;

create or replace function public.create_api_key_record(
  p_user_id uuid,
  p_name text,
  p_key_prefix text,
  p_key_hash text
)
returns public.api_keys
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_key public.api_keys%rowtype;
begin
  if char_length(p_name) not between 1 and 80 then raise exception 'invalid_key_name'; end if;
  if char_length(p_key_prefix) not between 8 and 24 then raise exception 'invalid_key_prefix'; end if;
  if p_key_hash !~ '^[a-f0-9]{64}$' then raise exception 'invalid_key_hash'; end if;
  if not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'profile_not_found';
  end if;
  insert into public.api_keys(user_id, name, key_prefix)
  values (p_user_id, p_name, p_key_prefix)
  returning * into v_key;
  insert into private.api_key_secrets(api_key_id, key_hash)
  values (v_key.id, p_key_hash);
  return v_key;
end;
$$;

create or replace function public.apply_sepay_payment(
  p_order_code text,
  p_provider_transaction_id text,
  p_reference_code text,
  p_amount_vnd bigint,
  p_transaction_at timestamptz,
  p_metadata jsonb default '{}'::jsonb
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.payment_orders%rowtype;
  v_transaction_id uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_order_code, 0));
  select * into v_order from public.payment_orders
  where order_code = p_order_code for update;

  if not found then return 'order_not_found'; end if;

  insert into public.payment_transactions(
    payment_order_id, provider_transaction_id, reference_code,
    transfer_type, amount_vnd, transaction_at, reconciliation_status, metadata
  ) values (
    v_order.id, p_provider_transaction_id, p_reference_code,
    'in', p_amount_vnd, p_transaction_at,
    case
      when p_amount_vnd < v_order.amount_vnd then 'partial'
      when p_amount_vnd > v_order.amount_vnd then 'excess'
      else 'matched'
    end,
    coalesce(p_metadata, '{}'::jsonb)
  ) on conflict (provider, provider_transaction_id) do nothing
  returning id into v_transaction_id;

  if v_transaction_id is null then return 'duplicate'; end if;
  if p_amount_vnd <> v_order.amount_vnd then
    update public.payment_orders set status = 'review' where id = v_order.id;
    return 'amount_mismatch';
  end if;
  if v_order.status = 'paid' then return 'already_paid'; end if;
  if v_order.status in ('refunded','failed') then return 'invalid_order_status'; end if;

  update public.payment_orders
  set status = 'paid', paid_at = p_transaction_at
  where id = v_order.id;

  insert into public.credit_ledger(
    user_id, units, entry_type, idempotency_key, payment_order_id, note
  ) values (
    v_order.user_id, v_order.credit_units, 'topup',
    'sepay:' || p_provider_transaction_id, v_order.id, 'SePay credit top-up'
  ) on conflict (idempotency_key) do nothing;
  return 'credited';
end;
$$;

create or replace function public.reserve_mcp_usage(
  p_user_id uuid,
  p_api_key_id uuid,
  p_skill_id uuid,
  p_tool_name text,
  p_request_id text,
  p_units bigint default 1
)
returns table(result text, usage_event_id uuid, available_units bigint)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event public.usage_events%rowtype;
  v_version_id uuid;
  v_balance bigint;
  v_reserved bigint;
begin
  if p_units <= 0 or p_units > 1000 then raise exception 'invalid_usage_units'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  select * into v_event from public.usage_events where request_id = p_request_id;
  if found then
    if v_event.user_id <> p_user_id then raise exception 'request_id_conflict'; end if;
    select coalesce(sum(units), 0) into v_balance from public.credit_ledger where user_id = p_user_id;
    return query select 'duplicate'::text, v_event.id, v_balance;
    return;
  end if;

  if not exists (
    select 1 from public.api_keys
    where id = p_api_key_id and user_id = p_user_id and revoked_at is null
  ) then raise exception 'invalid_api_key'; end if;

  select sv.id into v_version_id
  from public.skills s
  join public.skill_versions sv on sv.skill_id = s.id and sv.version = s.current_version
  where s.id = p_skill_id and s.status = 'active' and sv.scan_status = 'passed';
  if v_version_id is null then raise exception 'skill_not_available'; end if;

  select coalesce(sum(units), 0) into v_balance from public.credit_ledger where user_id = p_user_id;
  select coalesce(sum(units), 0) into v_reserved
  from public.usage_events where user_id = p_user_id and status = 'reserved';
  if v_balance - v_reserved < p_units then
    return query select 'insufficient_credits'::text, null::uuid, v_balance - v_reserved;
    return;
  end if;

  insert into public.usage_events(
    request_id, user_id, api_key_id, skill_id, skill_version_id, tool_name, units
  ) values (
    p_request_id, p_user_id, p_api_key_id, p_skill_id, v_version_id, p_tool_name, p_units
  ) returning * into v_event;
  return query select 'reserved'::text, v_event.id, v_balance - v_reserved - p_units;
end;
$$;

create or replace function public.finalize_mcp_usage(p_request_id text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event public.usage_events%rowtype;
begin
  select * into v_event from public.usage_events where request_id = p_request_id for update;
  if not found then return false; end if;
  if v_event.status = 'succeeded' then return true; end if;
  if v_event.status <> 'reserved' then return false; end if;

  update public.usage_events
  set status = 'succeeded', completed_at = now()
  where id = v_event.id;
  insert into public.credit_ledger(
    user_id, units, entry_type, idempotency_key, usage_event_id, note
  ) values (
    v_event.user_id, -v_event.units, 'usage',
    'usage:' || v_event.request_id, v_event.id, 'Successful MCP invocation'
  ) on conflict (idempotency_key) do nothing;
  return true;
end;
$$;

create or replace function public.release_mcp_usage(p_request_id text, p_error_code text default 'execution_failed')
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.usage_events
  set status = 'failed', error_code = left(p_error_code, 120), completed_at = now()
  where request_id = p_request_id and status = 'reserved';
  return found;
end;
$$;

create view public.user_credit_balances
with (security_invoker = true)
as
select user_id, coalesce(sum(units), 0)::bigint as available_units
from public.credit_ledger
group by user_id;

alter table public.profiles enable row level security;
alter table public.skills enable row level security;
alter table public.skill_versions enable row level security;
alter table public.api_keys enable row level security;
alter table private.api_key_secrets enable row level security;
alter table public.credit_packs enable row level security;
alter table public.payment_orders enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.usage_events enable row level security;
alter table public.credit_ledger enable row level security;

create policy profiles_select_own on public.profiles for select to authenticated
using ((select auth.uid()) = id);
create policy profiles_update_own on public.profiles for update to authenticated
using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy skills_select_active on public.skills for select to anon, authenticated
using (status = 'active');
create policy packs_select_active on public.credit_packs for select to authenticated
using (active = true);
create policy api_keys_select_own on public.api_keys for select to authenticated
using ((select auth.uid()) = user_id);
create policy orders_select_own on public.payment_orders for select to authenticated
using ((select auth.uid()) = user_id);
create policy transactions_select_own on public.payment_transactions for select to authenticated
using (exists (
  select 1 from public.payment_orders po
  where po.id = payment_order_id and po.user_id = (select auth.uid())
));
create policy usage_select_own on public.usage_events for select to authenticated
using ((select auth.uid()) = user_id);
create policy ledger_select_own on public.credit_ledger for select to authenticated
using ((select auth.uid()) = user_id);

revoke all on all tables in schema public from anon, authenticated;
grant select on public.skills to anon, authenticated;
grant select on public.profiles, public.api_keys, public.credit_packs,
  public.payment_orders, public.payment_transactions, public.usage_events,
  public.credit_ledger, public.user_credit_balances to authenticated;
grant update (display_name, avatar_url) on public.profiles to authenticated;

revoke all on function public.create_sepay_payment_order(uuid, uuid, timestamptz) from public, anon, authenticated;
revoke all on function public.create_api_key_record(uuid, text, text, text) from public, anon, authenticated;
revoke all on function public.apply_sepay_payment(text, text, text, bigint, timestamptz, jsonb) from public, anon, authenticated;
revoke all on function public.reserve_mcp_usage(uuid, uuid, uuid, text, text, bigint) from public, anon, authenticated;
revoke all on function public.finalize_mcp_usage(text) from public, anon, authenticated;
revoke all on function public.release_mcp_usage(text, text) from public, anon, authenticated;
grant execute on function public.create_sepay_payment_order(uuid, uuid, timestamptz) to service_role;
grant execute on function public.create_api_key_record(uuid, text, text, text) to service_role;
grant execute on function public.apply_sepay_payment(text, text, text, bigint, timestamptz, jsonb) to service_role;
grant execute on function public.reserve_mcp_usage(uuid, uuid, uuid, text, text, bigint) to service_role;
grant execute on function public.finalize_mcp_usage(text) to service_role;
grant execute on function public.release_mcp_usage(text, text) to service_role;

revoke all on function private.handle_new_user() from public, anon, authenticated;
revoke all on function private.set_updated_at() from public, anon, authenticated;

insert into public.credit_packs(code, name, price_vnd, credit_units)
values
  ('starter_20k', 'Starter 20K', 20000, 200),
  ('builder_50k', 'Builder 50K', 50000, 600),
  ('power_100k', 'Power 100K', 100000, 1400)
on conflict (code) do nothing;

-- Skill artifacts are never public. The service role issues protected content
-- through the MCP boundary; browser clients receive no storage.objects policy.
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values (
  'skill-artifacts',
  'skill-artifacts',
  false,
  52428800,
  array['application/zip', 'application/x-zip-compressed', 'text/markdown']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
