import { Headphones, PackageOpen, ShieldCheck, Truck } from "lucide-react";

const benefits = [
  { icon: Truck, title: "Free Delivery", sub: "On orders over Tk 999" },
  { icon: ShieldCheck, title: "Secure Payment", sub: "100% secure payments" },
  { icon: PackageOpen, title: "Easy Returns", sub: "7 days return policy" },
  { icon: Headphones, title: "24/7 Support", sub: "We are always here to help" },
];

/** Trust/benefits strip shown under the hero. */
export function BenefitsBar() {
  return (
    <section
      aria-label="Why shop with Zupona"
      className="mt-3 rounded-xl bg-card px-1 py-2 shadow-[0_1px_6px_rgba(0,0,0,0.06)] sm:px-3 sm:py-4"
    >
      <ul className="grid grid-cols-4">
        {benefits.map((b) => (
          <li
            key={b.title}
            className="flex items-center gap-1.5 border-r border-border/60 px-1.5 last:border-r-0 sm:gap-3 sm:px-4"
          >
            <b.icon className="h-4 w-4 shrink-0 text-gold sm:h-7 sm:w-7" />
            <div className="min-w-0">
              <p className="truncate text-[9px] font-semibold leading-tight text-foreground sm:text-sm">{b.title}</p>
              <p className="line-clamp-2 text-[8px] leading-tight text-muted-foreground sm:text-xs">{b.sub}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
