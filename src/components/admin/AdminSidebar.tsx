import {
  Archive,
  BarChart3,
  Boxes,
  ChevronLeft,
  ClipboardList,
  Download,
  FolderTree,
  HelpCircle,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
  Tag,
  Users,
  X,
} from "lucide-react";

export type AdminSection = "dashboard" | "catalog" | "orders" | "settings" | "tools";

type AdminSidebarProps = {
  activeSection: AdminSection;
  onSectionChange: (section: AdminSection) => void;
  open: boolean;
  onClose: () => void;
};

const primaryItems: Array<{ label: string; section: AdminSection; icon: typeof LayoutDashboard; badge?: string }> = [
  { label: "Dashboard", section: "dashboard", icon: LayoutDashboard },
  { label: "Products", section: "catalog", icon: Package },
  { label: "Orders", section: "orders", icon: ShoppingCart },
  { label: "Categories", section: "catalog", icon: FolderTree },
  { label: "Customers", section: "dashboard", icon: Users },
];

const secondaryItems: Array<{ label: string; section: AdminSection; icon: typeof LayoutDashboard }> = [
  { label: "Analytics", section: "dashboard", icon: BarChart3 },
  { label: "Marketing", section: "settings", icon: Tag },
  { label: "Discounts", section: "settings", icon: Tag },
  { label: "Coupons", section: "settings", icon: ClipboardList },
  { label: "Reviews", section: "dashboard", icon: Archive },
];

export function AdminSidebar({ activeSection, onSectionChange, open, onClose }: AdminSidebarProps) {
  const renderItem = (item: (typeof primaryItems)[number]) => {
    const Icon = item.icon;
    const active = item.section === activeSection && ["Dashboard", "Products", "Orders"].includes(item.label);
    return (
      <button
        key={item.label}
        type="button"
        onClick={() => { onSectionChange(item.section); onClose(); }}
        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition-colors ${active ? "bg-violet-500 text-white shadow-lg shadow-violet-950/25" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1">{item.label}</span>
        {item.badge && <span className="rounded-full bg-orange-400 px-1.5 py-0.5 text-[10px] text-slate-950">{item.badge}</span>}
      </button>
    );
  };

  return (
    <>
      <div className={`fixed inset-0 z-40 bg-slate-950/60 transition-opacity lg:hidden ${open ? "opacity-100" : "pointer-events-none opacity-0"}`} onClick={onClose} />
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col bg-[#11152d] px-4 py-5 text-white shadow-2xl transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:shadow-none ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center gap-3 px-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 text-sm font-black">Z</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black tracking-tight">Zupona</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Admin OS</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden" aria-label="Close admin navigation"><X className="h-4 w-4" /></button>
        </div>

        <nav className="mt-8 flex-1 space-y-1 overflow-y-auto">
          <p className="px-3 pb-2 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">Workspace</p>
          {primaryItems.map(renderItem)}
          <p className="px-3 pb-2 pt-7 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">Growth</p>
          {secondaryItems.map(renderItem)}
          <p className="px-3 pb-2 pt-7 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">System</p>
          {renderItem({ label: "Inventory", section: "catalog", icon: Boxes })}
          {renderItem({ label: "Site Settings", section: "settings", icon: Settings })}
          {renderItem({ label: "Backup & Import", section: "tools", icon: Download })}
          {renderItem({ label: "Help & Support", section: "dashboard", icon: HelpCircle })}
        </nav>

        <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3">
          <p className="text-xs font-bold text-white">Owner workspace</p>
          <p className="mt-1 text-[10px] leading-4 text-slate-400">Connected to the live catalog controls.</p>
          <ChevronLeft className="mt-3 h-4 w-4 rotate-180 text-violet-300" />
        </div>
      </aside>
    </>
  );
}
