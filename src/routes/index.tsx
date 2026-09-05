import { createFileRoute, Link, useLocation } from "@tanstack/react-router";
import { ArrowRight, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import heroCouple from "@/assets/hero-couple.jpg";
import heroWatch from "@/assets/p-watch.jpg";
import heroSerum from "@/assets/p-serum.jpg";
import heroPolo from "@/assets/p-polo.jpg";
import { BrandStrip } from "@/components/zupona/BrandStrip";
import { categories } from "@/components/zupona/data";
import { ProductCard } from "@/components/zupona/ProductCard";
import { ProductRail } from "@/components/zupona/ProductRail";
import { useShop } from "@/components/zupona/shop-store";
import { useIsMobile } from "@/hooks/use-mobile";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Zupona" },
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

type AudienceKey = "for-you" | "men" | "women" | "kids" | "baby";

const audienceTabs: { key: AudienceKey; label: string }[] = [
  { key: "for-you", label: "Discover" },
  { key: "men", label: "Men" },
  { key: "women", label: "Women" },
  { key: "kids", label: "Kids" },
  { key: "baby", label: "Baby" },
];

const audienceCatalog: Record<
  AudienceKey,
  { title: string; slugs?: string[]; viewAllTo: string; viewAllLabel: string }
> = {
  "for-you": {
    title: "Best Selling Products",
    viewAllTo: "/deals",
    viewAllLabel: "View All Deals",
  },
  men: {
    title: "Men's Collection",
    slugs: ["mens-fashion", "mens-accessories"],
    viewAllTo: "/category/mens-fashion",
    viewAllLabel: "View All Men",
  },
  women: {
    title: "Women's Collection",
    slugs: ["womens-fashion", "womens-accessories", "health-beauty", "beauty-personal-care", "bath-body"],
    viewAllTo: "/category/womens-fashion",
    viewAllLabel: "View All Women",
  },
  kids: {
    title: "Kids' & Toys Collection",
    slugs: ["toys", "sports-fitness"],
    viewAllTo: "/category/toys",
    viewAllLabel: "View All Kids",
  },
  baby: {
    title: "Baby Care & Essentials",
    slugs: ["baby-accessories"],
    viewAllTo: "/category/baby-accessories",
    viewAllLabel: "View All Baby",
  },
};


const heroSlides = [
  {
    image: heroCouple,
    alt: "Couple in elegant beige outfits in a warm living room",
    eyebrow: "Trusted by 100K+ Customers",
    title: "Trusted",
    highlight: "Online Shop",
    copy: "Premium Products\nFor Every Lifestyle",
    link: "/deals" as const,
    action: "Shop Now",
  },
  {
    image: heroWatch,
    alt: "Elegant watch from Zupona's accessories collection",
    eyebrow: "Timeless Style",
    title: "Make Every",
    highlight: "Moment Count",
    copy: "Premium accessories\nMade for your story",
    link: "/category/mens-accessories" as const,
    action: "Explore Now",
  },
  {
    image: heroSerum,
    alt: "Premium skincare serum from Zupona",
    eyebrow: "Beauty Essentials",
    title: "Glow With",
    highlight: "Confidence",
    copy: "Carefully chosen products\nFor your daily ritual",
    link: "/category/beauty-personal-care" as const,
    action: "Shop Beauty",
  },
] as const;

function Index() {
  const { products, bestSelling, topPicks, deals } = useShop();
  const location = useLocation();
  const isMobile = useIsMobile();
  const productBoundaryRef = useRef<HTMLDivElement | null>(null);
  const [isCategorySticky, setIsCategorySticky] = useState(false);
  const [stickyOffset, setStickyOffset] = useState(96);
  const [activeAudience, setActiveAudience] = useState<AudienceKey>("for-you");
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveHeroSlide((current) => (current + 1) % heroSlides.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      setIsCategorySticky(false);
      return;
    }

    const header = document.querySelector("header");
    const nextStickyOffset = header ? header.offsetHeight + 6 : 96;
    const compactRowHeight = 56;
    const productBoundary = productBoundaryRef.current;
    if (!productBoundary) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        const boundaryTop = entry.rootBounds?.top ?? nextStickyOffset + compactRowHeight;
        const next = entry.boundingClientRect.top < boundaryTop;
        if (next) {
          const headerBottom = document.querySelector("header")?.getBoundingClientRect().bottom;
          setStickyOffset(Math.round(headerBottom ?? nextStickyOffset));
        }
        setIsCategorySticky((previous) => {
          return previous === next ? previous : next;
        });
      },
      { rootMargin: `-${nextStickyOffset + compactRowHeight}px 0px 0px 0px` },
    );
    observer.observe(productBoundary);

    return () => {
      observer.disconnect();
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

  const audienceProducts = useMemo(() => {
    const currentConfig = audienceCatalog[activeAudience];
    if (currentConfig.slugs && currentConfig.slugs.length > 0) {
      const filtered = products.filter((product) => currentConfig.slugs?.includes(product.category));
      if (filtered.length > 0) return filtered;
    }
    return bestSelling.length > 0 ? bestSelling : products.slice(0, 8);
  }, [activeAudience, products, bestSelling]);

  const stickyNavRef = useRef<HTMLElement | null>(null);
  const inlineNavRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const scrollTabIntoCenter = (container: HTMLElement | null) => {
      if (!container) return;
      const activeBtn = container.querySelector(`[data-tab="${activeAudience}"]`) as HTMLElement | null;
      if (activeBtn) {
        const offset = activeBtn.offsetLeft - container.offsetWidth / 2 + activeBtn.offsetWidth / 2;
        container.scrollTo({ left: offset, behavior: "smooth" });
      }
    };

    scrollTabIntoCenter(stickyNavRef.current);
    scrollTabIntoCenter(inlineNavRef.current);
  }, [activeAudience]);

  // Touch swipe support to switch sections horizontally ("side theke dile")
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch) {
      touchStartX.current = touch.clientX;
      touchStartY.current = touch.clientY;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    if (!touch || touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = touchStartX.current - touch.clientX;
    const deltaY = touchStartY.current - touch.clientY;

    // Trigger if horizontal movement is dominant and > 40px
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
      const currentIndex = audienceTabs.findIndex((t) => t.key === activeAudience);
      if (deltaX > 0 && currentIndex < audienceTabs.length - 1) {
        const nextTab = audienceTabs[currentIndex + 1];
        if (nextTab) setActiveAudience(nextTab.key);
      } else if (deltaX < 0 && currentIndex > 0) {
        const prevTab = audienceTabs[currentIndex - 1];
        if (prevTab) setActiveAudience(prevTab.key);
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  const heroSlide = heroSlides[activeHeroSlide];
  if (!heroSlide) return null;

  const renderCategoryItem = (category: (typeof featuredCategories)[number], compact = false) => {
    const isActive = location.pathname === `/category/${category.slug}`;

    return (
      <Link
        key={category.slug}
        to="/category/$slug"
        params={{ slug: category.slug }}
        className={`flex items-center justify-center rounded-xl border px-1 py-2 text-center transition-colors ${
          isActive ? "border-gold bg-gold/10" : "border-transparent bg-secondary/35 hover:border-gold/40 hover:bg-secondary/60"
        } ${compact ? "min-w-[54px] shrink-0 flex-col gap-0.5 px-0" : "flex-col gap-1.5"}`}
        aria-current={isActive ? "page" : undefined}
      >
        <span
          className={`flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border bg-card ${
            isActive ? "border-gold" : "border-border/70"
          } ${compact ? "h-8 w-8" : "h-12 w-12"}`}
        >
          <img
            src={category.image}
            alt=""
            aria-hidden="true"
            loading="lazy"
            width={512}
            height={512}
            className={`${compact ? "h-6 w-6" : "h-10 w-10"} object-cover`}
          />
        </span>
        <span className={`${compact ? "line-clamp-1 text-[8px]" : "line-clamp-2 text-[9px]"} font-semibold leading-tight text-foreground sm:text-[10px]`}>
          {category.name}
        </span>
      </Link>
    );
  };

  return (
    <>
      <main className="mx-auto max-w-[1200px] px-3 sm:px-4">
        <section
          aria-labelledby="home-categories"
          className="mt-3 rounded-[20px] bg-card px-2 py-2.5 shadow-[0_1px_8px_rgba(0,0,0,0.04)]"
        >
          <div className="grid grid-cols-5 gap-2">{featuredCategories.map((category) => renderCategoryItem(category))}</div>
        </section>

        {/* Sticky audience tabs on mobile */}
        <nav
          ref={stickyNavRef}
          aria-label="Shop by audience"
          className={`fixed left-0 right-0 z-40 h-11 border-y border-border/60 bg-card/95 px-3 shadow-[0_8px_20px_rgba(0,0,0,0.06)] backdrop-blur-sm transition-[visibility,opacity] duration-150 md:hidden ${
            isCategorySticky ? "visible opacity-100" : "pointer-events-none invisible opacity-0"
          }`}
          style={{ top: `${stickyOffset}px` }}
        >
          <div className="mx-auto flex h-full max-w-[1200px] items-center overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex min-w-full justify-center gap-4 py-1">
              {audienceTabs.map((tab) => (
                <button
                  key={tab.key}
                  data-tab={tab.key}
                  type="button"
                  onClick={() => setActiveAudience(tab.key)}
                  aria-pressed={activeAudience === tab.key}
                  className={`relative min-w-[54px] shrink-0 px-2 py-2 text-[12px] font-bold transition-all cursor-pointer after:absolute after:bottom-0 after:left-1/2 after:h-0.5 after:-translate-x-1/2 after:bg-gold after:transition-all ${
                    activeAudience === tab.key
                      ? "text-foreground after:w-8 font-extrabold"
                      : "text-muted-foreground after:w-0 hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </nav>

        <section
          className="relative mt-3 overflow-hidden rounded-xl bg-accent"
          aria-roledescription="carousel"
          aria-label="Zupona featured offers"
        >
          <img
            key={heroSlide.image}
            src={heroSlide.image}
            alt={heroSlide.alt}
            width={1600}
            height={640}
            className="h-[190px] w-full object-cover object-center transition-opacity duration-500 sm:h-[300px] lg:h-[340px]"
          />
          <div className="absolute inset-y-0 left-0 flex max-w-[62%] flex-col justify-center gap-1.5 pl-4 sm:gap-2 sm:pl-10">
            <span className="w-fit rounded-full bg-gold/25 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-gold-deep sm:text-[11px]">
              {heroSlide.eyebrow}
            </span>
            <h1 className="text-xl font-bold uppercase leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              {heroSlide.title}
            </h1>
            <p className="text-xl font-bold uppercase leading-tight tracking-tight text-gold sm:text-3xl lg:text-4xl">
              {heroSlide.highlight}
            </p>
            <p className="text-[11px] leading-snug text-foreground/80 sm:text-lg">
              {heroSlide.copy.split("\n").map((line) => (
                <span key={line} className="block">{line}</span>
              ))}
            </p>
            <Link
              to={heroSlide.link as any}
              className="mt-1 flex w-fit items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-[11px] font-semibold text-card transition-opacity hover:opacity-90 sm:px-6 sm:py-2.5 sm:text-base"
            >
              {heroSlide.action}
              <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Link>
          </div>
          <div className="absolute bottom-2.5 left-1/2 flex -translate-x-1/2 gap-1.5" role="tablist" aria-label="Featured offers">
            {heroSlides.map((slide, index) => (
              <button
                key={slide.title}
                type="button"
                role="tab"
                aria-label={`Show featured offer ${index + 1}`}
                aria-selected={activeHeroSlide === index}
                onClick={() => setActiveHeroSlide(index)}
                className={`h-1 rounded-full transition-all sm:h-1.5 ${activeHeroSlide === index ? "w-5 bg-gold sm:w-6" : "w-5 bg-card/80 sm:w-6"}`}
              />
            ))}
          </div>
        </section>

        <div ref={productBoundaryRef} aria-hidden="true" className="h-px w-full" />
        <div>
        {/* Inline audience tabs bar */}
        <div
          ref={inlineNavRef}
          className="mt-4 flex items-center justify-center border-b border-border/50 pb-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div className="flex min-w-full justify-center gap-3 sm:gap-6 px-1">
            {audienceTabs.map((tab) => (
              <button
                key={tab.key}
                data-tab={tab.key}
                type="button"
                onClick={() => setActiveAudience(tab.key)}
                aria-pressed={activeAudience === tab.key}
                className={`relative px-2.5 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer after:absolute after:bottom-0 after:left-1/2 after:h-0.5 after:-translate-x-1/2 after:bg-gold after:transition-all ${
                  activeAudience === tab.key
                    ? "text-foreground after:w-full font-extrabold scale-105"
                    : "text-muted-foreground after:w-0 hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Audience products section with horizontal touch swipe support */}
        <section
          aria-labelledby="audience-products-title"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="relative mt-2 rounded-2xl bg-card px-2 py-3 sm:mt-4 sm:px-4 sm:py-5 transition-all"
        >
          <div className="mb-2 flex items-center justify-between sm:mb-4">
            <h2 id="audience-products-title" className="text-sm font-extrabold text-foreground sm:text-xl">
              {audienceCatalog[activeAudience].title}
            </h2>
            <Link
              to={audienceCatalog[activeAudience].viewAllTo as any}
              className="flex items-center gap-1 text-[11px] font-medium text-gold hover:underline sm:text-sm"
            >
              {audienceCatalog[activeAudience].viewAllLabel}
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <ul
            key={activeAudience}
            className="grid grid-cols-2 items-stretch gap-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 animate-in fade-in duration-200"
          >
            {audienceProducts.slice(0, 8).map((p) => (
              <li key={p.id} className="h-full">
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
        </section>

        <BrandStrip />

        <ProductRail
          id="new-arrivals"
          title="New Arrivals"
          products={products.slice(0, 8)}
          viewAllTo="/categories"
        />
        </div>
      </main>
    </>
  );
}
