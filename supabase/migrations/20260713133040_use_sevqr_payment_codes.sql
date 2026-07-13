alter table public.payment_orders
  drop constraint if exists payment_orders_order_code_check;

alter table public.payment_orders
  add constraint payment_orders_order_code_check
  check (order_code ~ '^(NSK|SEVQR)[A-F0-9]{18}$');

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
    'SEVQR' || upper(encode(extensions.gen_random_bytes(9), 'hex')),
    v_pack.price_vnd,
    v_pack.credit_units,
    p_expires_at
  ) returning * into v_order;
  return v_order;
end;
$$;

revoke all on function public.create_sepay_payment_order(uuid, uuid, timestamptz) from public, anon, authenticated;
grant execute on function public.create_sepay_payment_order(uuid, uuid, timestamptz) to service_role;
