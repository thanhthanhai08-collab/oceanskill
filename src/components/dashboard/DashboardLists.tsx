import type {DashboardMcpKey, DashboardOrder, DashboardUsage} from "@/lib/dashboard/data";

export interface DashboardListsProps {
  readonly mcpKeys: DashboardMcpKey[];
  readonly usage: DashboardUsage[];
  readonly orders: DashboardOrder[];
  readonly locale: string;
  readonly labels: Readonly<{
    mcpKeys: string;
    usage: string;
    orders: string;
    emptyKeys: string;
    emptyUsage: string;
    emptyOrders: string;
    active: string;
    revoked: string;
  }>;
}

export default function DashboardLists({mcpKeys, usage, orders, locale, labels}: DashboardListsProps) {
  const formatDate = (value: string) => new Intl.DateTimeFormat(locale, {dateStyle: "medium"}).format(new Date(value));
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <section id="mcpKeys" className="rounded-2xl border border-outline-variant/40 bg-surface-container-low/65 p-6">
        <h2 className="flex items-center gap-3 font-geist text-xl font-semibold"><span className="material-symbols-outlined text-primary">vpn_key</span>{labels.mcpKeys}</h2>
        <div className="mt-5 space-y-3">{mcpKeys.length ? mcpKeys.map((key) => <div key={key.id} className="flex items-center justify-between gap-4 rounded-xl bg-surface-container p-4"><div className="min-w-0"><p className="truncate font-semibold">{key.name}</p><p className="mt-1 font-mono text-[10px] text-on-surface-variant">{key.key_prefix}••••</p></div><span className={`rounded-full px-2 py-1 font-mono text-[10px] ${key.revoked_at ? "bg-error/10 text-error" : "bg-tertiary/10 text-tertiary"}`}>{key.revoked_at ? labels.revoked : labels.active}</span></div>) : <p className="rounded-xl border border-dashed border-outline-variant/40 p-6 text-sm text-on-surface-variant">{labels.emptyKeys}</p>}</div>
      </section>
      <section id="usage" className="rounded-2xl border border-outline-variant/40 bg-surface-container-low/65 p-6">
        <h2 className="flex items-center gap-3 font-geist text-xl font-semibold"><span className="material-symbols-outlined text-tertiary">monitoring</span>{labels.usage}</h2>
        <div className="mt-5 space-y-3">{usage.length ? usage.map((item) => <div key={item.id} className="flex items-center justify-between gap-4 rounded-xl border-b border-outline-variant/25 px-1 py-3"><div><p className="font-mono text-xs">{item.tool_name}</p><p className="mt-1 text-xs text-on-surface-variant">{formatDate(item.created_at)}</p></div><span className="font-geist font-semibold text-secondary">-{item.units}</span></div>) : <p className="rounded-xl border border-dashed border-outline-variant/40 p-6 text-sm text-on-surface-variant">{labels.emptyUsage}</p>}</div>
      </section>
      <section className="rounded-2xl border border-outline-variant/40 bg-surface-container-low/65 p-6 xl:col-span-2">
        <h2 className="flex items-center gap-3 font-geist text-xl font-semibold"><span className="material-symbols-outlined text-secondary">receipt_long</span>{labels.orders}</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2">{orders.length ? orders.map((order) => <div key={order.id} className="flex items-center justify-between rounded-xl bg-surface-container p-4"><div><p className="font-semibold">{order.amount_vnd.toLocaleString(locale)} VND</p><p className="mt-1 text-xs text-on-surface-variant">{formatDate(order.created_at)} · {order.credit_units} credits</p></div><span className="rounded-full bg-primary/10 px-2 py-1 font-mono text-[10px] uppercase text-primary">{order.status}</span></div>) : <p className="rounded-xl border border-dashed border-outline-variant/40 p-6 text-sm text-on-surface-variant">{labels.emptyOrders}</p>}</div>
      </section>
    </div>
  );
}
