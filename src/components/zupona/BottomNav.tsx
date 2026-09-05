import { Link } from "@tanstack/react-router";
import { BadgePercent, Heart, Home, LayoutGrid, User } from "lucide-react";

const items = [
  { label: "Home", icon: Home, to: "/" as const },
  { label: "Categories", icon: LayoutGrid, to: "/categories" as const },
  { label: "Offers", icon: BadgePercent, to: "/deals" as const },
  { label: "Wishlist", icon: Heart, to: "/wishlist" as const },
  { label: "Account", icon: User, to: "/account" as const },
];

export function BottomNav() {
  return (
    <nav
      className="border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 shadow-[0_-4px_16px_-8px_rgba(0,0,0,0.25)]"
      style={{
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <ul className="mx-auto grid max-w-[520px] grid-cols-5 items-stretch px-1">
        {items.map(({ label, icon: Icon, to }) => (
          <li key={label} className="min-w-0">
            <Link
              to={to}
              activeOptions={{ exact: to === "/" }}
              activeProps={{ className: "text-primary font-semibold [&>span:first-child]:bg-primary/10" }}
              inactiveProps={{ className: "text-muted-foreground" }}
              className="flex flex-col items-center gap-0.5 py-1.5 text-[11px] leading-none transition-colors hover:text-primary"
            >
              <span className="flex h-8 w-12 items-center justify-center rounded-full transition-colors">
                <Icon className="h-5 w-5" />
              </span>
              <span className="w-full truncate text-center">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
