begin;

alter table public.payment_orders
  add column if not exists purpose text not null default 'credits',
  add column if not exists skill_slots integer not null default 0;

alter table public.payment_orders
  alter column pack_id drop not null,
  drop constraint if exists payment_orders_credit_units_check,
  add constraint payment_orders_purpose_check check (purpose in ('credits', 'creator_slots')),
  add constraint payment_orders_value_check check (
    (purpose = 'credits' and pack_id is not null and credit_units > 0 and skill_slots = 0)
    or (purpose = 'creator_slots' and pack_id is null and credit_units = 0 and skill_slots > 0 and amount_vnd = skill_slots::bigint * 5000)
  );

create or replace function public.create_creator_slot_payment_order(
  p_user_id uuid,
  p_amount_vnd bigint,
  p_expires_at timestamptz default (now() + interval '15 minutes')
)
returns public.payment_orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.payment_orders%rowtype;
  v_slots integer;
begin
  if p_expires_at <= now() or p_expires_at > now() + interval '24 hours' then raise exception 'invalid_expiration'; end if;
  if p_amount_vnd < 5000 or p_amount_vnd > 5000000 or p_amount_vnd % 5000 <> 0 then raise exception 'invalid_slot_amount'; end if;
  if not exists (select 1 from public.profiles where id = p_user_id) then raise exception 'profile_not_found'; end if;
  v_slots := (p_amount_vnd / 5000)::integer;
  if exists (select 1 from public.profiles where id = p_user_id and creator_skill_limit + v_slots > 1000) then raise exception 'slot_limit_exceeded'; end if;

  insert into public.payment_orders(
    user_id, pack_id, order_code, amount_vnd, credit_units, purpose, skill_slots, expires_at
  ) values (
    p_user_id, null, 'SEVQR' || upper(encode(extensions.gen_random_bytes(9), 'hex')),
    p_amount_vnd, 0, 'creator_slots', v_slots, p_expires_at
  ) returning * into v_order;
  return v_order;
end;
$$;

revoke all on function public.create_creator_slot_payment_order(uuid, bigint, timestamptz) from public, anon, authenticated;
grant execute on function public.create_creator_slot_payment_order(uuid, bigint, timestamptz) to service_role;

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
  select * into v_order from public.payment_orders where order_code = p_order_code for update;
  if not found then return 'order_not_found'; end if;

  insert into public.payment_transactions(
    payment_order_id, provider_transaction_id, reference_code, transfer_type,
    amount_vnd, transaction_at, reconciliation_status, metadata
  ) values (
    v_order.id, p_provider_transaction_id, p_reference_code, 'in', p_amount_vnd, p_transaction_at,
    case when p_amount_vnd < v_order.amount_vnd then 'partial' when p_amount_vnd > v_order.amount_vnd then 'excess' else 'matched' end,
    coalesce(p_metadata, '{}'::jsonb)
  ) on conflict (provider, provider_transaction_id) do nothing returning id into v_transaction_id;

  if v_transaction_id is null then return 'duplicate'; end if;
  if p_amount_vnd <> v_order.amount_vnd then
    update public.payment_orders set status = 'review' where id = v_order.id;
    return 'amount_mismatch';
  end if;
  if v_order.status = 'paid' then return 'already_paid'; end if;
  if v_order.status in ('refunded', 'failed') then return 'invalid_order_status'; end if;

  update public.payment_orders set status = 'paid', paid_at = p_transaction_at where id = v_order.id;
  if v_order.purpose = 'creator_slots' then
    update public.profiles
    set creator_skill_limit = creator_skill_limit + v_order.skill_slots
    where id = v_order.user_id;
    return 'slots_added';
  end if;

  insert into public.credit_ledger(user_id, units, entry_type, idempotency_key, payment_order_id, note)
  values (v_order.user_id, v_order.credit_units, 'topup', 'sepay:' || p_provider_transaction_id, v_order.id, 'SePay credit top-up')
  on conflict (idempotency_key) do nothing;
  return 'credited';
end;
$$;

drop policy if exists skill_collections_select_own_or_platform on public.skill_collections;
create policy skill_collections_select_own_or_platform
  on public.skill_collections for select to anon, authenticated
  using (collection_type = 'platform' or (collection_type = 'user' and user_id = (select auth.uid())));

drop policy if exists skill_collection_items_select_own_or_platform on public.skill_collection_items;
create policy skill_collection_items_select_own_or_platform
  on public.skill_collection_items for select to anon, authenticated
  using (exists (
    select 1 from public.skill_collections c
    where c.id = collection_id
      and (c.collection_type = 'platform' or (c.collection_type = 'user' and c.user_id = (select auth.uid())))
  ));

drop policy if exists skill_collection_translations_select_accessible on public.skill_collection_translations;
create policy skill_collection_translations_select_accessible
  on public.skill_collection_translations for select to anon, authenticated
  using (exists (
    select 1 from public.skill_collections c
    where c.id = collection_id
      and (c.collection_type = 'platform' or (c.collection_type = 'user' and c.user_id = (select auth.uid())))
  ));

grant select on public.skill_collections, public.skill_collection_items, public.skill_collection_translations to anon;

commit;
