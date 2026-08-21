import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ChevronRight } from "lucide-react";

import heroCouple from "@/assets/hero-couple.jpg";
import { BenefitsBar } from "@/components/zupona/BenefitsBar";
import { BrandStrip } from "@/components/zupona/BrandStrip";
import { CategoryStrip } from "@/components/zupona/CategoryStrip";
import { DealStrip } from "@/components/zupona/DealStrip";
import { ProductCard } from "@/components/zupona/ProductCard";
import { ProductRail } from "@/components/zupona/ProductRail";
import { bestSelling, deals, products, topPicks } from "@/components/zupona/data";
import { useFlashDeal } from "@/hooks/use-flash-deal";



export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Zupona — Trusted Online Shop in Bangladesh" },
      {
        name: "description",
        content:
          "Shop premium beauty, fashion, watches, home and baby products at Zupona. Free delivery over Tk 999, 30-day returns and secure checkout.",
      },
      { property: "og:title", content: "Zupona — Trusted Online Shop in Bangladesh" },
      {
        property: "og:description",
        content:
          "Shop premium beauty, fashion, watches, home and baby products at Zupona. Free delivery over Tk 999, 30-day returns and secure checkout.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});


function Index() {
  const { expired, ready } = useFlashDeal();
  const dealsOver = ready && expired;

  return (

    <>
      <main className="mx-auto max-w-[1200px] px-3 sm:px-4">
        {/* Hero */}
        <section className="relative mt-2 overflow-hidden rounded-xl bg-accent">
          <img
            src={heroCouple}
            alt="Couple in elegant beige outfits in a warm living room"
            width={1600}
            height={640}
            className="h-[190px] w-full object-cover object-right sm:h-[300px] lg:h-[340px]"
          />
          <div className="absolute inset-y-0 left-0 flex max-w-[62%] flex-col justify-center gap-1.5 pl-4 sm:gap-2 sm:pl-10">
            <span className="w-fit rounded-full bg-gold/25 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-gold-deep sm:text-[11px]">
              Trusted by 100K+ Customers
            </span>
            <h1 className="text-xl font-bold uppercase leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Trusted
            </h1>
            <p className="text-xl font-bold uppercase leading-tight tracking-tight text-gold sm:text-3xl lg:text-4xl">
              Online Shop
            </p>
            <p className="text-[11px] leading-snug text-foreground/80 sm:text-lg">
              Premium Products
              <br />
              For Every Lifestyle
            </p>
            <Link
              to="/deals"
              className="mt-1 flex w-fit items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-[11px] font-semibold text-card transition-opacity hover:opacity-90 sm:px-6 sm:py-2.5 sm:text-base"
            >
              Shop Now
              <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Link>
          </div>
          <div className="absolute bottom-2.5 left-1/2 flex -translate-x-1/2 gap-1.5">
            <span className="h-1 w-5 rounded-full bg-gold sm:h-1.5 sm:w-6" />
            <span className="h-1 w-5 rounded-full bg-card/80 sm:h-1.5 sm:w-6" />
            <span className="h-1 w-5 rounded-full bg-card/80 sm:h-1.5 sm:w-6" />
          </div>
        </section>

        <BenefitsBar />

        <DealStrip />

        <div className="hidden md:block">
          <CategoryStrip />
        </div>

        {dealsOver ? (
          <section
            aria-label="Deals of the Day"
            className="rounded-2xl border border-border bg-card px-4 py-6 text-center"
          >
            <p className="text-base font-extrabold text-foreground">Deals of the Day ended</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Fresh flash deals unlock at midnight. Browse everything else meanwhile.
            </p>
          </section>
        ) : (
          <ProductRail
            id="deals-rail"
            title="Deals of the Day"
            products={deals.slice(0, 8)}
            viewAllTo="/deals"
          />
        )}




        {/* Best Selling */}
        <section aria-labelledby="best-selling" className="relative mt-4 rounded-2xl bg-card px-2 py-3 sm:mt-8 sm:px-4 sm:py-5">
          <div className="mb-2 flex items-center justify-between sm:mb-4">
            <h2 id="best-selling" className="text-sm font-extrabold text-foreground sm:text-xl">
              Best Selling Products
            </h2>
            <Link
              to="/deals"
              className="flex items-center gap-1 text-[11px] font-medium text-gold hover:underline sm:text-sm"
            >
              View All
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <ul className="grid grid-cols-2 items-stretch gap-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {bestSelling.map((p) => (
              <li key={p.brand} className="h-full">
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
          <button
            type="button"
            aria-label="Next products"
            className="absolute -right-3 top-1/2 hidden h-9 w-9 items-center justify-center rounded-full border border-border bg-card shadow-md hover:text-gold lg:flex"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </section>

        <ProductRail id="top-picks" title="Top Picks For You" products={topPicks} viewAllTo="/categories" />

        <BrandStrip />

        <ProductRail
          id="new-arrivals"
          title="New Arrivals"
          products={products.slice(-8)}
          viewAllTo="/categories"
        />



      </main>

    </>

  );
}
