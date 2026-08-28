import { useState, type ReactNode } from "react";
import { AdminSidebar, type AdminSection } from "./AdminSidebar";
import { AdminTopBar } from "./AdminTopBar";

export function AdminShell({
  activeSection,
  onSectionChange,
  searchQuery,
  onSearchChange,
  children,
}: {
  activeSection: AdminSection;
  onSectionChange: (section: AdminSection) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  children: ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-900 lg:flex">
      <AdminSidebar activeSection={activeSection} onSectionChange={onSectionChange} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="min-w-0 flex-1">
        <AdminTopBar searchQuery={searchQuery} onSearchChange={onSearchChange} onMenuOpen={() => setSidebarOpen(true)} />
        <main className="min-w-0 px-3 py-4 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
