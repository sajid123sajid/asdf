import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { BarChart3, Store, Truck, Wallet } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/sell")({
  head: () => ({
    meta: [
      { title: "Sell on Zupona — Become a Seller" },
      {
        name: "description",
        content:
          "Reach thousands of Bangladeshi shoppers. Register your shop on Zupona for free listings, nationwide delivery and weekly payouts.",
      },
      { property: "og:title", content: "Sell on Zupona — Become a Seller" },
      {
        property: "og:description",
        content: "Free listings, nationwide delivery support and weekly payouts for Zupona sellers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SellPage,
});

const perks = [
  { icon: Store, title: "Free shop setup", sub: "No listing fees for your first 100 products" },
  { icon: Truck, title: "Delivery handled", sub: "We pick up and deliver nationwide" },
  { icon: Wallet, title: "Weekly payouts", sub: "Money in your bank every Sunday" },
  { icon: BarChart3, title: "Sales insights", sub: "Track views, orders and returns" },
];

function SellPage() {
  const [form, setForm] = useState({ shop: "", name: "", phone: "", category: "" });

  return (
    <main className="mx-auto max-w-[1000px] px-4 py-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sell on Zupona</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Join a growing marketplace and start taking orders this week.
          </p>
        </div>
        <Link
          to="/admin"
          className="inline-flex items-center gap-1.5 rounded-lg border border-gold bg-gold/10 px-4 py-2 text-xs font-bold text-gold-deep hover:bg-gold hover:text-primary-foreground"
        >
          <span>⚡ Open Product Manager &amp; Admin</span>
        </Link>
      </div>

      <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {perks.map(({ icon: Icon, title, sub }) => (
          <li key={title} className="rounded-lg border border-border bg-card p-4">
            <Icon className="h-5 w-5 text-gold" />
            <p className="mt-2 text-sm font-semibold text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground">{sub}</p>
          </li>
        ))}
      </ul>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.shop.trim() || !form.phone.trim()) {
            toast.error("Shop name and phone are required");
            return;
          }
          toast.success("Application received — our team will call you within 24 hours");
          setForm({ shop: "", name: "", phone: "", category: "" });
        }}
        className="mt-8 rounded-lg border border-border bg-card p-5"
      >
        <h2 className="text-lg font-semibold text-foreground">Register your shop</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            { key: "shop" as const, label: "Shop name", placeholder: "Zupona Traders" },
            { key: "name" as const, label: "Your name", placeholder: "Full name" },
            { key: "phone" as const, label: "Phone", placeholder: "01700-000000" },
            { key: "category" as const, label: "Main category", placeholder: "Fashion, beauty…" },
          ].map((f) => (
            <label key={f.key} className="block text-sm">
              <span className="text-foreground">{f.label}</span>
              <input
                value={form[f.key]}
                onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
              />
            </label>
          ))}
        </div>
        <button
          type="submit"
          className="mt-4 rounded-md bg-gold px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-gold-deep"
        >
          Submit application
        </button>
      </form>
    </main>
  );
}
