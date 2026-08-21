import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, MessageCircle, Phone } from "lucide-react";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help Center — Zupona Customer Support" },
      {
        name: "description",
        content:
          "Answers on delivery, returns, payments and order changes, plus hotline, email and live chat support from Zupona.",
      },
      { property: "og:title", content: "Help Center — Zupona" },
      {
        property: "og:description",
        content: "Delivery, returns, payment and order FAQs plus direct contact options.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HelpPage,
});

const faqs = [
  {
    q: "How long does delivery take?",
    a: "Inside Dhaka 1–2 days, outside Dhaka 2–4 days. Orders above Tk 999 ship free.",
  },
  {
    q: "Can I return a product?",
    a: "Yes — request a return within 30 days of delivery, provided the item is unused and in its original packaging.",
  },
  {
    q: "Which payment methods do you accept?",
    a: "bKash, Nagad, Rocket, all major cards, and cash on delivery nationwide.",
  },
  {
    q: "Can I change or cancel my order?",
    a: "You can change or cancel any order before it is packed. Contact our hotline with your order number.",
  },
  {
    q: "How do I track my parcel?",
    a: "Open the Track Order page and enter the order number from your confirmation message.",
  },
];

const channels = [
  { icon: Phone, title: "Hotline", sub: "+880 1700-000000", note: "9am – 10pm daily" },
  { icon: Mail, title: "Email", sub: "support@zupona.com", note: "Reply within 12 hours" },
  { icon: MessageCircle, title: "Live chat", sub: "Chat with an agent", note: "9am – 10pm daily" },
];

function HelpPage() {
  return (
    <main className="mx-auto max-w-[1000px] px-4 py-6">
      <h1 className="text-2xl font-bold text-foreground">Help center</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Quick answers to the questions we hear most often.
      </p>

      <ul className="mt-5 grid gap-3 sm:grid-cols-3">
        {channels.map(({ icon: Icon, title, sub, note }) => (
          <li key={title} className="rounded-lg border border-border bg-card p-4">
            <Icon className="h-5 w-5 text-gold" />
            <p className="mt-2 text-sm font-semibold text-foreground">{title}</p>
            <p className="text-sm text-foreground">{sub}</p>
            <p className="text-xs text-muted-foreground">{note}</p>
          </li>
        ))}
      </ul>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-foreground">Frequently asked questions</h2>
        <div className="mt-3 divide-y divide-border rounded-lg border border-border bg-card">
          {faqs.map((f) => (
            <details key={f.q} className="group px-4 py-3">
              <summary className="cursor-pointer list-none text-sm font-medium text-foreground group-open:text-gold">
                {f.q}
              </summary>
              <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          to="/track-order"
          className="rounded-md bg-gold px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-gold-deep"
        >
          Track an order
        </Link>
        <Link
          to="/categories"
          className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground hover:border-gold"
        >
          Continue shopping
        </Link>
      </div>
    </main>
  );
}
