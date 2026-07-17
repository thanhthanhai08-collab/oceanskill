create index if not exists payment_orders_pack_id_idx
  on public.payment_orders(pack_id)
  where pack_id is not null;
