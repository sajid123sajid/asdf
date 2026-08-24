import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import {
  LogIn,
  LogOut,
  MapPin,
  Package,
  Heart,
  ShoppingCart,
  User,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Truck,
  X,
  Edit2,
  Save,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  authenticate,
  getCurrentUser,
  getUserOrders,
  logout,
  updateProfile,
  type SafeUser,
} from "../auth";
import type { OrderRecord } from "../db";
import { formatTk } from "@/components/zupona/data";
import { useShop } from "@/components/zupona/shop-store";

export const Route = createFileRoute("/account")({
  loader: async () => {
    try {
      const user = await getCurrentUser();
      const orders = user ? await getUserOrders() : [];
      return { user, orders };
    } catch {
      return { user: null as SafeUser | null, orders: [] as OrderRecord[] };
    }
  },
  head: () => ({
    meta: [
      { title: "My Account — Zupona" },
      {
        name: "description",
        content:
          "Manage your Zupona account: orders, delivery address, wishlist and profile settings.",
      },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { user, orders } = Route.useLoaderData();
  const router = useRouter();
  const { cartCount, wishlist } = useShop();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(user?.name || "");
  const [editPhone, setEditPhone] = useState(user?.phone || "");
  const [editAddress, setEditAddress] = useState(user?.address || "");
  const [profileSaving, setProfileSaving] = useState(false);

  // Active Tab: "orders" | "profile"
  const [activeTab, setActiveTab] = useState<"orders" | "profile">("orders");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (user) {
      setEditName(user.name || "");
      setEditPhone(user.phone || "");
      setEditAddress(user.address || "");
    }
  }, [user]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      const result = await authenticate({
        data: {
          email,
          password,
          name,
          phone,
          address,
          mode: authMode,
        },
      });

      toast.success(
        result.status === "signed_up"
          ? "Account created successfully! Welcome to Zupona."
          : "Signed in successfully!"
      );
      setIsModalOpen(false);
      setEmail("");
      setPassword("");
      setName("");
      setPhone("");
      setAddress("");
      await router.invalidate();
    } catch (err: any) {
      toast.error(err?.message || "Authentication failed. Please check your credentials.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("You have been signed out.");
      await router.invalidate();
    } catch {
      toast.error("Logout failed. Please try again.");
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      await updateProfile({
        data: {
          name: editName,
          phone: editPhone,
          address: editAddress,
        },
      });
      toast.success("Profile details updated successfully!");
      setIsEditingProfile(false);
      await router.invalidate();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update profile.");
    } finally {
      setProfileSaving(false);
    }
  };

  return (
    <main className="mx-auto max-w-[1200px] px-3 pb-12 pt-3 md:px-4 md:pt-6">
      {user ? (
        /* ================= Logged In State ================= */
        <div className="space-y-6">
          {/* User Header Profile Card */}
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/15 text-xl font-bold text-gold ring-4 ring-gold/10">
                  {(user.name || user.email)[0].toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-bold text-foreground sm:text-xl">
                      {user.name || user.email.split("@")[0]}
                    </h1>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <ShieldCheck className="h-3 w-3" /> Verified
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground sm:text-sm">{user.email}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("profile");
                    setIsEditingProfile(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
                >
                  <Edit2 className="h-3.5 w-3.5" /> Edit Profile
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-2 text-xs font-semibold text-destructive hover:bg-destructive/20 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" /> Sign Out
                </button>
              </div>
            </div>

            {/* Quick Stats Banner */}
            <div className="mt-5 grid grid-cols-3 gap-3 border-t border-border pt-4 text-center">
              <div className="rounded-lg bg-background p-2.5">
                <p className="text-xs text-muted-foreground">Orders</p>
                <p className="text-base font-bold text-foreground">{orders.length}</p>
              </div>
              <Link to="/wishlist" className="rounded-lg bg-background p-2.5 hover:bg-secondary transition-colors">
                <p className="text-xs text-muted-foreground">Wishlist</p>
                <p className="text-base font-bold text-gold">{wishlist.length}</p>
              </Link>
              <Link to="/cart" className="rounded-lg bg-background p-2.5 hover:bg-secondary transition-colors">
                <p className="text-xs text-muted-foreground">Cart Items</p>
                <p className="text-base font-bold text-foreground">{cartCount}</p>
              </Link>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-border text-sm font-semibold">
            <button
              onClick={() => setActiveTab("orders")}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition-colors ${
                activeTab === "orders"
                  ? "border-gold text-gold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Package className="h-4 w-4" /> My Orders ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition-colors ${
                activeTab === "profile"
                  ? "border-gold text-gold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <User className="h-4 w-4" /> Profile & Address
            </button>
          </div>

          {/* Tab Content: Orders */}
          {activeTab === "orders" && (
            <section className="space-y-4">
              {orders.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                    <Package className="h-6 w-6" />
                  </div>
                  <h3 className="mt-3 text-base font-bold text-foreground">No orders yet</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    You haven&apos;t placed any orders yet. Discover our top collections!
                  </p>
                  <Link
                    to="/"
                    className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-gold px-5 py-2 text-xs font-semibold text-primary-foreground hover:bg-gold-deep"
                  >
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <div className="grid gap-4">
                  {orders.map((order) => {
                    let itemsList: any[] = [];
                    try {
                      itemsList = JSON.parse(order.items);
                    } catch {
                      itemsList = [];
                    }

                    return (
                      <div
                        key={order.id}
                        className="rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:border-gold/50"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                          <div>
                            <span className="font-mono text-sm font-bold text-foreground">
                              Order #{order.id}
                            </span>
                            <p className="text-xs text-muted-foreground">
                              {order.created_at
                                ? new Date(order.created_at).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  })
                                : "Recent"}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                              <Clock className="h-3 w-3" /> {order.status || "Order confirmed"}
                            </span>
                            <Link
                              to="/track-order"
                              className="inline-flex items-center gap-1 text-xs font-semibold text-gold hover:underline"
                            >
                              Track <ExternalLink className="h-3 w-3" />
                            </Link>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="mt-3 space-y-2">
                          {itemsList.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs sm:text-sm">
                              <span className="text-foreground">
                                {item.qty} × {item.name || item.slug}
                              </span>
                              <span className="font-semibold text-foreground">
                                {formatTk(item.price * item.qty)}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs sm:text-sm">
                          <span className="text-muted-foreground">
                            Delivery to: <span className="font-medium text-foreground">{order.shipping_address}</span>
                          </span>
                          <span className="text-sm font-bold text-foreground">
                            Total: {formatTk(order.total_amount)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* Tab Content: Profile & Address */}
          {activeTab === "profile" && (
            <section className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-foreground">Personal Information & Address</h2>
                {!isEditingProfile && (
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold hover:underline"
                  >
                    <Edit2 className="h-3.5 w-3.5" /> Edit
                  </button>
                )}
              </div>

              {isEditingProfile ? (
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full rounded-lg border border-border bg-background p-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-gold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="e.g. 01700000000"
                      className="w-full rounded-lg border border-border bg-background p-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-gold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      Delivery Address
                    </label>
                    <textarea
                      rows={3}
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      placeholder="House, Road, Area, City"
                      className="w-full rounded-lg border border-border bg-background p-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-gold"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={profileSaving}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-gold-deep"
                    >
                      <Save className="h-3.5 w-3.5" />
                      {profileSaving ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="rounded-lg border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3 rounded-lg bg-secondary/50 p-3">
                    <User className="h-4 w-4 text-gold" />
                    <div>
                      <p className="text-xs text-muted-foreground">Full Name</p>
                      <p className="font-semibold text-foreground">{user.name || "Not set"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg bg-secondary/50 p-3">
                    <Mail className="h-4 w-4 text-gold" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="font-semibold text-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg bg-secondary/50 p-3">
                    <Phone className="h-4 w-4 text-gold" />
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="font-semibold text-foreground">{user.phone || "Not set"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg bg-secondary/50 p-3">
                    <MapPin className="h-4 w-4 text-gold" />
                    <div>
                      <p className="text-xs text-muted-foreground">Default Delivery Address</p>
                      <p className="font-semibold text-foreground">{user.address || "Not set"}</p>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      ) : (
        /* ================= Guest / Not Logged In State ================= */
        <div className="space-y-6">
          {/* Hero Sign In Callout */}
          <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm sm:flex-row sm:p-8">
            <div className="text-center sm:text-left">
              <h1 className="text-xl font-bold text-foreground sm:text-2xl">
                Welcome to Zupona
              </h1>
              <p className="mt-1 max-w-md text-xs text-muted-foreground sm:text-sm">
                Sign in to manage your orders, save delivery addresses, and enjoy faster checkout.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setAuthMode("signin");
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-gold-deep shadow-sm transition-transform active:scale-95"
            >
              <LogIn className="h-4 w-4" /> Sign In / Sign Up
            </button>
          </div>

          {/* Value Props */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-gold/10 text-gold">
                <Truck className="h-5 w-5" />
              </div>
              <h3 className="mt-2 text-sm font-bold text-foreground">Fast Delivery</h3>
              <p className="text-xs text-muted-foreground">Free shipping across Bangladesh on Tk 999+</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-gold/10 text-gold">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="mt-2 text-sm font-bold text-foreground">100% Authentic</h3>
              <p className="text-xs text-muted-foreground">Genuine products with 30-day easy return policy</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-gold/10 text-gold">
                <Package className="h-5 w-5" />
              </div>
              <h3 className="mt-2 text-sm font-bold text-foreground">Order Tracking</h3>
              <p className="text-xs text-muted-foreground">Live tracking updates from warehouse to doorstep</p>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal Popup */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Modal Tabs */}
            <div className="mb-6 flex rounded-lg bg-secondary p-1">
              <button
                type="button"
                onClick={() => setAuthMode("signin")}
                className={`flex-1 rounded-md py-1.5 text-xs font-bold transition-all ${
                  authMode === "signin"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setAuthMode("signup")}
                className={`flex-1 rounded-md py-1.5 text-xs font-bold transition-all ${
                  authMode === "signup"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Create Account
              </button>
            </div>

            <h2 className="mb-1 text-lg font-bold text-foreground">
              {authMode === "signin" ? "Welcome Back" : "Create your Account"}
            </h2>
            <p className="mb-4 text-xs text-muted-foreground">
              {authMode === "signin"
                ? "Enter your credentials to access your orders and profile."
                : "Fill in your details to register as a new Zupona customer."}
            </p>

            <form onSubmit={handleAuth} className="space-y-3.5">
              {authMode === "signup" && (
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background p-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-gold"
                    placeholder="e.g. Sajid Ahmed"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background p-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-gold"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background p-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-gold"
                  placeholder="••••••••"
                />
              </div>

              {authMode === "signup" && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background p-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-gold"
                      placeholder="01700000000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      Delivery Address (Optional)
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background p-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-gold"
                      placeholder="Dhaka, Bangladesh"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full rounded-lg bg-gold py-2.5 text-sm font-semibold text-primary-foreground hover:bg-gold-deep transition-colors shadow-sm disabled:opacity-50"
              >
                {authLoading
                  ? "Processing..."
                  : authMode === "signin"
                  ? "Sign In"
                  : "Create Account"}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}