import { createFileRoute } from "@tanstack/react-router";
import { ProductCard } from "@/components/zupona/ProductCard";
import { useShop } from "@/components/zupona/shop-store";
import { useFlashDeal } from "@/hooks/use-flash-deal";

export const Route = createFileRoute("/deals")({
  head: () => ({
    meta: [
      { title: "Today's Deals & Discounts — Zupona" },
      {
        name: "description",
        content:
          "Save big on Zupona deals: up to 30% off beauty, watches, fashion, toys and home essentials, ranked by biggest discount.",
      },
      { property: "og:title", content: "Today's Deals — Zupona" },
      { property: "og:description", content: "The biggest discounts on Zupona, updated daily." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DealsPage,
});

function DealsPage() {
  const { hours, minutes, seconds, expired, ready } = useFlashDeal();
  const { deals } = useShop();
  const over = ready && expired;
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-6">
      <div
        className={`rounded-lg px-5 py-6 ${over ? "bg-secondary text-foreground" : "bg-gold text-primary-foreground"}`}
      >
        <h1 className="text-2xl font-bold">Today&apos;s Deals</h1>
        <p className="mt-1 text-sm opacity-90">
          {over
            ? "These deals have expired. New offers unlock at midnight."
            : `Up to ${deals[0]?.discount || 25}% off — limited stock, ends in ${
                ready ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}` : "--:--:--"
              }.`}
        </p>
      </div>

      <ul
        className={`mt-5 grid grid-cols-2 items-stretch gap-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 ${
          over ? "pointer-events-none opacity-50" : ""
        }`}
        aria-disabled={over}
      >
        {deals.map((p) => (
          <li key={p.id} className="h-full">
            <ProductCard product={p} />
          </li>
        ))}
      </ul>
    </main>
  );
}
