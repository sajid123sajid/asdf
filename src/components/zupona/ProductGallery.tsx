import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

/**
 * Swipeable product gallery with pagination dots, image counter and a
 * fullscreen viewer. Falls back gracefully to a single beautiful image.
 */
export function ProductGallery({
  images,
  alt,
  discount,
}: {
  images: string[];
  alt: string;
  discount?: number;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    if (!zoomed) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoomed(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomed]);

  const onScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
    setActive(Math.min(images.length - 1, Math.max(0, i)));
  };

  const goTo = (i: number) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
    setActive(i);
  };

  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-muted/60 to-card">
        <div
          ref={trackRef}
          onScroll={onScroll}
          className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {images.map((img, i) => (
            <button
              key={`${img}-${i}`}
              type="button"
              onClick={() => setZoomed(true)}
              aria-label="View image fullscreen"
              className="min-w-full shrink-0 snap-center cursor-zoom-in p-4 sm:p-8"
            >
              <img
                src={img}
                alt={`${alt} — image ${i + 1}`}
                width={640}
                height={640}
                loading={i === 0 ? "eager" : "lazy"}
                className="mx-auto h-[260px] w-full object-contain sm:h-[420px]"
              />
            </button>
          ))}
        </div>

        {typeof discount === "number" && discount > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-sale px-2 py-0.5 text-[11px] font-bold text-primary-foreground">
            -{discount}%
          </span>
        )}
        {images.length > 1 && (
          <span className="absolute bottom-3 right-3 rounded-full bg-foreground/70 px-2 py-0.5 text-[11px] font-semibold text-background">
            {active + 1}/{images.length}
          </span>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex items-center justify-center gap-2">
          {images.map((img, i) => (
            <button
              key={`dot-${img}-${i}`}
              type="button"
              aria-label={`Go to image ${i + 1}`}
              onClick={() => goTo(i)}
              className={`h-2 rounded-full transition-all ${i === active ? "w-5 bg-gold" : "w-2 bg-border"}`}
            />
          ))}
        </div>
      )}

      {zoomed && (
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
          <img
            src={images[active]}
            alt={alt}
            className="max-h-[85vh] w-auto max-w-full object-contain"
          />
        </div>
      )}
    </div>
  );
}
