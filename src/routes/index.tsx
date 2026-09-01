import { createFileRoute, Link, useLocation } from "@tanstack/react-router";
import { ArrowRight, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import heroCouple from "@/assets/hero-couple.jpg";
import { BrandStrip } from "@/components/zupona/BrandStrip";
import { categories } from "@/components/zupona/data";
import { ProductCard } from "@/components/zupona/ProductCard";
import { ProductRail } from "@/components/zupona/ProductRail";
import { useShop } from "@/components/zupona/shop-store";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const { products, bestSelling, topPicks, deals } = useShop();
  const location = useLocation();
  const isMobile = useIsMobile();
  const categorySectionRef = useRef<HTMLElement | null>(null);
  const [isCategorySticky, setIsCategorySticky] = useState(false);
  const [stickyOffset, setStickyOffset] = useState(96);

  useEffect(() => {
    if (!isMobile) {
      setIsCategorySticky(false);
      return;
    }

    const updateCategoryState = () => {
      const section = categorySectionRef.current;
      if (!section) return;

      const header = document.querySelector("header");
      const nextStickyOffset = header ? header.offsetHeight + 6 : 96;
      setStickyOffset(nextStickyOffset);

      const sectionTop = section.getBoundingClientRect().top + window.scrollY;
      const shouldStick = window.scrollY > sectionTop - nextStickyOffset;
      setIsCategorySticky((prev) => (prev === shouldStick ? prev : shouldStick));
    };

    let raf = 0;
    const handleScroll = () => {
      cancelAnimationFrame(raf);
      raf = window.requestAnimationFrame(updateCategoryState);
    };

    updateCategoryState();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [isMobile]);

  const featuredCategorySlugs = [
    "mens-fashion",
    "womens-fashion",
    "baby-accessories",
    "toys",
    "home-living",
    "electronics",
    "beauty-personal-care",
    "sports-fitness",
    "groceries",
    "automotive",
  ] as const;

  const featuredCategories = featuredCategorySlugs
    .map((slug) => categories.find((category) => category.slug === slug))
    .filter((category): category is NonNullable<typeof category> => Boolean(category));

  const renderCategoryItem = (category: (typeof featuredCategories)[number]) => {
    const isActive = location.pathname === `/category/${category.slug}`;

    return (
      <Link
        key={category.slug}
        to="/category/$slug"
        params={{ slug: category.slug }}
        className={`flex items-center justify-center gap-1.5 rounded-xl border px-1 py-2 text-center transition-colors ${
          isActive ? "border-gold bg-gold/10" : "border-transparent bg-secondary/35 hover:border-gold/40 hover:bg-secondary/60"
        } ${isMobile && isCategorySticky ? "min-w-[72px] shrink-0" : "flex-col"}`}
        aria-current={isActive ? "page" : undefined}
      >
        <span
          className={`flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border bg-card ${
            isActive ? "border-gold" : "border-border/70"
          } ${isMobile && isCategorySticky ? "h-9 w-9" : "h-12 w-12"}`}
        >
          <img
            src={category.image}
            alt=""
            aria-hidden="true"
            loading="lazy"
            width={512}
            height={512}
            className={`${isMobile && isCategorySticky ? "h-7 w-7" : "h-10 w-10"} object-cover`}
          />
        </span>
        <span className={`${isMobile && isCategorySticky ? "text-[9px]" : "line-clamp-2 text-[9px]"} font-semibold leading-tight text-foreground sm:text-[10px]`}>
          {category.name}
        </span>
      </Link>
    );
  };

  return (
    <>
      <main className="mx-auto max-w-[1200px] px-3 sm:px-4">
        <section
          ref={categorySectionRef}
          aria-labelledby="home-categories"
          className={`mt-3 rounded-[20px] bg-card px-2 py-2.5 shadow-[0_1px_8px_rgba(0,0,0,0.04)] ${
            isMobile && isCategorySticky
              ? "sticky z-40 border border-border/60 bg-card/95 shadow-[0_8px_20px_rgba(0,0,0,0.06)] backdrop-blur-sm"
              : ""
          }`}
          style={isMobile && isCategorySticky ? { top: `${stickyOffset}px` } : undefined}
        >
          {isMobile && isCategorySticky ? (
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {featuredCategories.map(renderCategoryItem)}
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-2">{featuredCategories.map(renderCategoryItem)}</div>
          )}
        </section>

        <section className="relative mt-3 overflow-hidden rounded-xl bg-accent">
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

        <ProductRail
          id="deals-rail"
          title="Deals of the Day"
          products={deals.slice(0, 8)}
          viewAllTo="/deals"
        />

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
            {(bestSelling.length > 0 ? bestSelling : products.slice(0, 4)).map((p) => (
              <li key={p.id} className="h-full">
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

        <ProductRail
          id="top-picks"
          title="Top Picks For You"
          products={topPicks.length > 0 ? topPicks : products.slice(0, 8)}
          viewAllTo="/categories"
        />

        <BrandStrip />

        <ProductRail
          id="new-arrivals"
          title="New Arrivals"
          products={products.slice(0, 8)}
          viewAllTo="/categories"
        />
      </main>
    </>
  );
}
