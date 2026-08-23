import { createFileRoute, Link } from "@tanstack/react-router";
import { LogIn, MapPin, Settings, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "My Account — Zupona" },
      {
        name: "description",
        content: "Manage your Zupona account: orders, addresses, wishlist and cart in one place.",
      },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // ডাটা সাবমিট হবে
      toast.success("Account processed successfully!");
      setIsModalOpen(false);
      setEmail("");
      setPassword("");
    } catch (err) {
      toast.error("Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-[1200px] px-3 pb-6 pt-2 md:px-4 md:pt-4">
      {/* Guest sign-in row */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
        <div>
          <h1 className="text-base font-bold text-foreground">Hello, Guest</h1>
          <p className="text-xs text-muted-foreground">Sign in to sync your orders and wishlist</p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-gold px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-gold-deep"
        >
          <LogIn className="h-3.5 w-3.5" /> Sign In / Sign Up
        </button>
      </div>

      {/* Modal Popup */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-lg">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="mb-4 text-lg font-bold text-foreground">Sign In or Sign Up</h2>
            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-md border border-border bg-background p-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-gold"
                  placeholder="enter your email"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-md border border-border bg-background p-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-gold"
                  placeholder="enter password"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md bg-gold py-2 text-sm font-semibold text-primary-foreground hover:bg-gold-deep"
              >
                {loading ? "Processing..." : "Continue"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Addresses */}
      <section className="mt-3 rounded-xl border border-border bg-card p-4">
        <button
          type="button"
          onClick={() => toast.info("Address book is coming soon")}
          className="flex w-full items-center gap-3 text-left"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-gold">
            <MapPin className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-foreground">Addresses</h2>
            <p className="text-xs text-muted-foreground">Manage delivery info</p>
          </div>
        </button>
      </section>

      {/* Preferences */}
      <section className="mt-3 rounded-xl border border-border bg-card p-4">
        <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
          <Settings className="h-4 w-4" /> Preferences
        </h2>
        <ul className="mt-3 divide-y divide-border text-sm">
          <li className="flex items-center justify-between py-2.5">
            <span className="text-muted-foreground">Language</span>
            <span className="font-semibold text-foreground">English</span>
          </li>
          <li className="flex items-center justify-between py-2.5">
            <span className="text-muted-foreground">Currency</span>
            <span className="font-semibold text-foreground">TK. BDT</span>
          </li>
          <li className="flex items-center justify-between py-2.5">
            <span className="text-muted-foreground">Support</span>
            <Link to="/help" className="font-semibold text-gold hover:underline">
              Help Center
            </Link>
          </li>
        </ul>
      </section>
    </main>
  );
}