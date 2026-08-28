import type { LucideIcon } from "lucide-react";

export function AdminKpiCard({ label, value, icon: Icon, tone }: { label: string; value: string; icon: LucideIcon; tone: "violet" | "blue" | "green" | "orange" }) {
  const tones = {
    violet: "bg-violet-100 text-violet-700",
    blue: "bg-blue-100 text-blue-700",
    green: "bg-emerald-100 text-emerald-700",
    orange: "bg-orange-100 text-orange-700",
  };
  return <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"><div className="flex items-center justify-between"><p className="text-xs font-semibold text-slate-500">{label}</p><span className={`grid h-9 w-9 place-items-center rounded-xl ${tones[tone]}`}><Icon className="h-4 w-4" /></span></div><p className="mt-4 text-2xl font-black tracking-tight text-slate-900">{value}</p></article>;
}