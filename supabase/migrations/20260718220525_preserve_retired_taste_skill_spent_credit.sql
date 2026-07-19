begin;

-- Correct the already-applied retirement migration without restoring deleted
-- usage data. On a fresh database the prior migration creates this key and
-- this statement is an idempotent no-op.
insert into public.credit_ledger (
  user_id, units, entry_type, idempotency_key, note
)
select
  p.id,
  -1,
  'adjustment',
  'retire:taste-skill:preserve-spent-credit',
  'Preserve spent credit while removing retired taste-skill usage history'
from public.profiles p
where (select count(*) from public.profiles) = 1
on conflict (idempotency_key) do nothing;

do $$
begin
  if not exists (
    select 1 from public.credit_ledger
    where idempotency_key = 'retire:taste-skill:preserve-spent-credit'
      and entry_type = 'adjustment'
      and units = -1
      and usage_event_id is null
  ) then raise exception 'retired_taste_skill_balance_not_preserved'; end if;
end;
$$;

commit;
