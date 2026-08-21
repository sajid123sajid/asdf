import { createFileRoute, Link } from "@tanstack/react-router";
import { LogIn, MapPin, Settings } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "My Account — Zupona" },
      {
        name: "description",
        content: "Manage your Zupona account: orders, addresses, wishlist and cart in one place.",
      },
      { property: "og:title", content: "My Account — Zupona" },
      { property: "og:description", content: "Manage your Zupona orders and preferences." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  // Reset scroll so the full header (delivery row + search + categories) is visible
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <main className="mx-auto max-w-[1200px] px-3 pb-6 pt-2 md:px-4 md:pt-4">
      {/* Guest sign-in row */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
        <div>
          <h1 className="text-base font-bold text-foreground">Hello, Guest</h1>
          <p className="text-xs text-muted-foreground">Sign in to sync your orders and wishlist</p>
        </div>
        <button
          type="button"
          onClick={() => toast.info("Sign in will be available once accounts are enabled")}
          className="inline-flex items-center gap-1.5 rounded-full bg-gold px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-gold-deep"
        >
          <LogIn className="h-3.5 w-3.5" /> Sign In
        </button>
      </div>

      {/* Addresses */}
      <section className="mt-3 rounded-xl border border-border bg-card p-4">
        <button
          type="button"
          onClick={() => toast.info("Address book is coming soon")}
          className="flex w-full items-center gap-3 text-left"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-gold">
            <MapPin className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-foreground">Addresses</h2>
            <p className="text-xs text-muted-foreground">Manage delivery info</p>
          </div>
        </button>
      </section>

      {/* Preferences */}
      <section className="mt-3 rounded-xl border border-border bg-card p-4">
        <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
          <Settings className="h-4 w-4" /> Preferences
        </h2>
        <ul className="mt-3 divide-y divide-border text-sm">
          <li className="flex items-center justify-between py-2.5">
            <span className="text-muted-foreground">Language</span>
            <span className="font-semibold text-foreground">English</span>
          </li>
          <li className="flex items-center justify-between py-2.5">
            <span className="text-muted-foreground">Currency</span>
            <span className="font-semibold text-foreground">TK. BDT</span>
          </li>
          <li className="flex items-center justify-between py-2.5">
            <span className="text-muted-foreground">Support</span>
            <Link to="/help" className="font-semibold text-gold hover:underline">
              Help Center
            </Link>
          </li>
        </ul>
      </section>
    </main>
  );
}
