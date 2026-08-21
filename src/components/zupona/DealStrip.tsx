import { Link } from "@tanstack/react-router";
import { Flame } from "lucide-react";
import { DEAL_TIME_ZONE, useFlashDeal } from "@/hooks/use-flash-deal";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Flash-deal banner with a timezone-safe countdown to midnight (store time). */
export function DealStrip() {
  const { hours, minutes, seconds, expired, ready } = useFlashDeal();
  const over = ready && expired;

  return (
    <section
      aria-label="Flash deals"
      className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-secondary px-3 py-3 sm:mt-6 sm:px-5 sm:py-4"
    >
      <div className="flex min-w-0 items-center gap-2">
        <Flame
          className={`h-5 w-5 shrink-0 sm:h-7 sm:w-7 ${over ? "text-muted-foreground" : "text-gold"}`}
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold uppercase tracking-tight text-foreground sm:text-lg">
            Flash Deals
          </p>
          <p className="truncate text-[10px] text-muted-foreground sm:text-xs">
            {over ? "Today's deals have ended" : `Ends at midnight (${DEAL_TIME_ZONE.split("/")[1]})`}
          </p>
        </div>
      </div>

      {over ? (
        <span className="shrink-0 rounded-md bg-muted px-2 py-1 text-[11px] font-bold text-muted-foreground sm:text-sm">
          Expired
        </span>
      ) : (
        <div
          className="flex shrink-0 items-center gap-1"
          role="timer"
          aria-live="off"
          aria-label={`Flash deals end in ${hours} hours ${minutes} minutes`}
        >
          {[hours, minutes, seconds].map((v, i) => (
            <span
              key={i}
              className="rounded-md bg-foreground px-1.5 py-1 text-[11px] font-extrabold text-card sm:px-2 sm:text-sm"
            >
              {ready ? pad(v) : "--"}
            </span>
          ))}
        </div>
      )}

      {over ? (
        <span
          aria-disabled="true"
          className="pointer-events-none shrink-0 cursor-not-allowed rounded-full bg-muted px-3 py-1.5 text-[11px] font-bold text-muted-foreground sm:px-5 sm:py-2 sm:text-sm"
        >
          Shop
        </span>
      ) : (
        <Link
          to="/deals"
          className="shrink-0 rounded-full bg-gold px-3 py-1.5 text-[11px] font-bold text-primary-foreground transition-colors hover:bg-gold-deep sm:px-5 sm:py-2 sm:text-sm"
        >
          Shop
        </Link>
      )}
    </section>
  );
}
