import { useEffect, useState } from "react";

/** Store timezone — the flash-deal window always ends at local midnight in Dhaka. */
export const DEAL_TIME_ZONE = "Asia/Dhaka";

const partsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: DEAL_TIME_ZONE,
  hour12: false,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/**
 * Seconds remaining until midnight in the store timezone, independent of the
 * viewer's own device timezone or clock offset from UTC.
 */
export function secondsUntilDealEnd(now: Date = new Date()): number {
  const parts = partsFormatter.formatToParts(now);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? "0");

  // "24" is emitted by some engines for midnight; normalise it to 0.
  const hour = read("hour") % 24;
  const elapsed = hour * 3600 + read("minute") * 60 + read("second");
  return 86_400 - elapsed;
}

export type FlashDeal = {
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  /** True once the window has closed and before the next tick rolls over. */
  expired: boolean;
  /** False until the first client tick, so SSR and hydration agree. */
  ready: boolean;
};

const idle: FlashDeal = {
  hours: 0,
  minutes: 0,
  seconds: 0,
  totalSeconds: 0,
  expired: false,
  ready: false,
};

/** Live countdown for the daily flash-deal window. */
export function useFlashDeal(): FlashDeal {
  const [state, setState] = useState<FlashDeal>(idle);

  useEffect(() => {
    const tick = () => {
      const total = Math.max(0, secondsUntilDealEnd());
      setState({
        hours: Math.floor(total / 3600),
        minutes: Math.floor((total % 3600) / 60),
        seconds: total % 60,
        totalSeconds: total,
        expired: total <= 0,
        ready: true,
      });
    };

    tick();
    const id = window.setInterval(tick, 1000);
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return state;
}
