import { AlertTriangle, Archive, CheckCircle2, PackageX } from "lucide-react";
import type { AdminDashboardOverview } from "@/db";

export function AdminProductHealth({ health }: { health: AdminDashboardOverview["productHealth"] }) {
  const items = [
    ["Total products", health.total, PackageX, "text-slate-700"],
    ["Published", health.published, CheckCircle2, "text-emerald-600"],
    ["Draft / unpublished", health.unpublished, Archive, "text-violet-600"],
    ["Low stock", health.lowStock, AlertTriangle, "text-orange-600"],
    ["Out of stock", health.outOfStock, PackageX, "text-rose-600"],
  ] as const;
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-600">Catalog health</p><h2 className="mt-1 text-base font-black text-slate-900">Product health</h2><div className="mt-4 grid gap-2 sm:grid-cols-2">{items.map(([label, value, Icon, color]) => <div key={label} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-3"><span className="flex items-center gap-2 text-xs font-semibold text-slate-600"><Icon className={`h-4 w-4 ${color}`} />{label}</span><strong className="text-sm text-slate-900">{value === null ? "Unavailable" : value}</strong></div>)}</div></section>;
}