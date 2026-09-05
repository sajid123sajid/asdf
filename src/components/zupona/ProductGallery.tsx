import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type GallerySlide = {
  type: "image" | "video";
  src: string;
  alt: string;
};

function buildGallerySlides(images: string[], alt: string, video?: string): GallerySlide[] {
  const deduped = new Set<string>();
  const slides: GallerySlide[] = [];

  images.filter(Boolean).forEach((src, index) => {
    if (deduped.has(src)) return;
    deduped.add(src);
    slides.push({ type: "image", src, alt: `${alt} — image ${index + 1}` });
  });

  const videoSrc = video?.trim();
  if (videoSrc && !deduped.has(videoSrc)) {
    slides.push({ type: "video", src: videoSrc, alt: `${alt} — product video` });
    deduped.add(videoSrc);
  }

  return slides;
}

/**
 * A Zepto-like sequential product gallery that keeps the existing product page
 * intact while showing the product's real images and video in one swipeable flow.
 */
export function ProductGallery({
  images,
  alt,
  discount,
  video,
}: {
  images: string[];
  alt: string;
  discount?: number;
  video?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef<number | null>(null);
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  const slides = useMemo(() => buildGallerySlides(images, alt, video), [images, alt, video]);

  useEffect(() => {
    setActive((current) => Math.min(current, Math.max(slides.length - 1, 0)));
  }, [slides.length]);

  useEffect(() => {
    if (!zoomed) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setZoomed(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomed]);

  const onScroll = () => {
    const el = trackRef.current;
    if (!el || !slides.length) return;
    const nextIndex = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
    setActive(Math.min(slides.length - 1, Math.max(0, nextIndex)));
  };

  const goTo = (index: number) => {
    const el = trackRef.current;
    const bounded = Math.min(Math.max(index, 0), slides.length - 1);
    if (!el || !slides.length) return;
    el.scrollTo({ left: bounded * el.clientWidth, behavior: "smooth" });
    setActive(bounded);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    dragStartX.current = event.clientX;
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (dragStartX.current == null) return;
    const delta = event.clientX - dragStartX.current;
    if (Math.abs(delta) > 60) {
      goTo(active + (delta < 0 ? 1 : -1));
    }
    dragStartX.current = null;
  };

  const currentSlide = slides[active];

  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-muted/60 to-card shadow-sm">
        <div
          ref={trackRef}
          onScroll={onScroll}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {slides.map((slide, index) => (
            <div key={`${slide.type}-${slide.src}-${index}`} className="min-w-full shrink-0 snap-center p-3 sm:p-6 md:p-8">
              {slide.type === "video" ? (
                <div className="flex h-[260px] items-center justify-center overflow-hidden rounded-xl bg-black sm:h-[420px]">
                  <video
                    key={slide.src}
                    controls
                    preload="metadata"
                    playsInline
                    src={slide.src}
                    className="h-full w-full object-contain bg-black"
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setZoomed(true)}
                  aria-label={`View ${slide.alt}`}
                  className="flex min-h-[260px] w-full cursor-zoom-in items-center justify-center overflow-hidden rounded-xl bg-card sm:min-h-[420px]"
                >
                  <img
                    src={slide.src}
                    alt={slide.alt}
                    width={640}
                    height={640}
                    loading={index === 0 ? "eager" : "lazy"}
                    decoding="async"
                    className="max-h-[420px] max-w-full w-auto object-contain"
                  />
                </button>
              )}
            </div>
          ))}
        </div>

        {typeof discount === "number" && discount > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-sale px-2 py-0.5 text-[11px] font-bold text-primary-foreground">
            -{discount}%
          </span>
        )}

        {slides.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous media"
              onClick={() => goTo(active - 1)}
              disabled={active === 0}
              className="absolute left-2 top-1/2 hidden -translate-y-1/2 place-items-center rounded-full border border-border bg-background/80 p-2 text-foreground shadow-sm transition hover:bg-background md:grid disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Next media"
              onClick={() => goTo(active + 1)}
              disabled={active === slides.length - 1}
              className="absolute right-2 top-1/2 hidden -translate-y-1/2 place-items-center rounded-full border border-border bg-background/80 p-2 text-foreground shadow-sm transition hover:bg-background md:grid disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <span className="absolute bottom-3 right-3 rounded-full bg-foreground/70 px-2 py-0.5 text-[11px] font-semibold text-background">
              {active + 1}/{slides.length}
            </span>
          </>
        )}
      </div>

      {slides.length > 1 && (
        <div className="mt-3 flex items-center justify-center gap-2">
          {slides.map((slide, index) => (
            <button
              key={`dot-${slide.type}-${slide.src}-${index}`}
              type="button"
              aria-label={`Go to media ${index + 1}`}
              aria-pressed={index === active}
              onClick={() => goTo(index)}
              className={`h-2.5 rounded-full transition-all ${index === active ? "w-6 bg-gold" : "w-2.5 bg-border"}`}
            />
          ))}
        </div>
      )}

      {zoomed && currentSlide && currentSlide.type !== "video" && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Product image"
          onClick={() => setZoomed(false)}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-foreground/90 p-4"
        >
          <button
            type="button"
            aria-label="Close image"
            onClick={() => setZoomed(false)}
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-background/90 text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
          <img src={currentSlide.src} alt={currentSlide.alt} className="max-h-[85vh] w-auto max-w-full object-contain" />
        </div>
      )}
    </div>
  );
}
