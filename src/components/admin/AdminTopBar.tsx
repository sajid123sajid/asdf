import { Bell, Menu, Moon, Search, Store, Sun } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function AdminTopBar({
  searchQuery,
  onSearchChange,
  onMenuOpen,
}: {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onMenuOpen: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 flex min-h-[72px] items-center gap-3 border-b border-slate-200/80 bg-[#f7f8fc]/90 px-4 backdrop-blur-xl sm:px-6">
      <button type="button" onClick={onMenuOpen} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:border-violet-300 hover:text-violet-600 lg:hidden" aria-label="Open admin navigation"><Menu className="h-5 w-5" /></button>
      <div className="relative hidden max-w-md flex-1 md:block">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input value={searchQuery} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search products, orders, customers..." className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-xs text-slate-800 outline-none transition-shadow placeholder:text-slate-400 focus:border-violet-300 focus:ring-4 focus:ring-violet-100" aria-label="Search admin records" />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Link to="/" className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition-colors hover:border-violet-300 hover:text-violet-700 sm:inline-flex"><Store className="h-4 w-4" /> Visit Store</Link>
        <button type="button" className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm hover:border-violet-300 hover:text-violet-700" aria-label="Toggle theme"><Sun className="h-4 w-4 dark:hidden" /><Moon className="hidden h-4 w-4 dark:block" /></button>
        <button type="button" className="relative grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm hover:border-violet-300 hover:text-violet-700" aria-label="Notifications"><Bell className="h-4 w-4" /></button>
        <div className="hidden items-center gap-2 border-l border-slate-200 pl-3 sm:flex"><div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-blue-500 text-xs font-black text-white">S</div><div><p className="text-xs font-bold text-slate-800">Sajid Ahmed</p><p className="text-[10px] text-slate-400">Owner</p></div></div>
      </div>
    </header>
  );
}
