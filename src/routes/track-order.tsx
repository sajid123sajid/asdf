import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Circle, PackageSearch } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/track-order")({
  head: () => ({
    meta: [
      { title: "Track Your Order — Zupona" },
      {
        name: "description",
        content: "Enter your Zupona order number to see live delivery progress and estimated arrival.",
      },
      { property: "og:title", content: "Track Your Order — Zupona" },
      { property: "og:description", content: "Live delivery progress for your Zupona order." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TrackOrderPage,
});

const steps = [
  { title: "Order confirmed", sub: "We received your order" },
  { title: "Packed", sub: "Your parcel left our warehouse" },
  { title: "In transit", sub: "On the way to your city" },
  { title: "Out for delivery", sub: "Rider will call you soon" },
  { title: "Delivered", sub: "Enjoy your purchase" },
];

function TrackOrderPage() {
  const [code, setCode] = useState("");
  const [tracked, setTracked] = useState<string | null>(null);
  const current = 2;

  return (
    <main className="mx-auto max-w-[900px] px-4 py-6">
      <h1 className="text-2xl font-bold text-foreground">Track your order</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter the order number from your confirmation message.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!code.trim()) {
            toast.error("Please enter an order number");
            return;
          }
          setTracked(code.trim().toUpperCase());
        }}
        className="mt-5 flex flex-col gap-3 sm:flex-row"
      >
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="e.g. ZUP-10245"
          aria-label="Order number"
          className="flex-1 rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
        />
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-md bg-gold px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-gold-deep"
        >
          <PackageSearch className="h-4 w-4" />
          Track
        </button>
      </form>

      {tracked && (
        <section className="mt-7 rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground">Order {tracked}</h2>
          <p className="mt-1 text-xs text-muted-foreground">Estimated delivery in 2–3 days</p>
          <ol className="mt-5 space-y-4">
            {steps.map((s, i) => (
              <li key={s.title} className="flex gap-3">
                {i <= current ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 fill-gold/15 text-gold" />
                ) : (
                  <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                )}
                <div>
                  <p
                    className={`text-sm font-medium ${
                      i <= current ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {s.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{s.sub}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </main>
  );
}
