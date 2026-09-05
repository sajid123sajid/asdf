import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  CreditCard,
  FileText,
  Lock,
  MapPin,
  PackageCheck,
  ShieldCheck,
  ShoppingCart,
  Store,
  Truck,
  Wallet,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { formatTk } from "@/components/zupona/data";
import { useShop } from "@/components/zupona/shop-store";
import { getCurrentUser, placeOrder, startOnlinePayment, type SafeUser } from "../auth";
import type { OrderRecord } from "../db";

export const Route = createFileRoute("/checkout")({
  validateSearch: (search: Record<string, unknown>) => ({
    slug: typeof search["slug"] === "string" ? (search["slug"] as string) : undefined,
  }),
  beforeLoad: async () => {
    const user = await getCurrentUser();
    if (!user) {
      throw redirect({ to: "/login", search: { returnTo: "/checkout" } });
    }
  },
  loader: async () => {
    try {
      const user = await getCurrentUser();
      return { user };
    } catch {
      return { user: null as SafeUser | null };
    }
  },
  head: () => ({
    meta: [
      { title: "Checkout — Zupona" },
      {
        name: "description",
        content:
          "Complete your Zupona order in seconds: confirm delivery address, choose delivery and payment method, and complete your order.",
      },
      { property: "og:title", content: "Checkout — Zupona" },
      { property: "og:description", content: "Fast, secure checkout with cash on delivery and online payment options." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CheckoutPage,
});

type DeliveryMethod = "standard" | "express" | "pickup";
type PaymentMethod = "COD" | "BKASH" | "NAGAD" | "CARD" | "SSLCOMMERZ";

// Payment Logo Badges
function BkashBadge() {
  return (
    <div className="flex items-center gap-1 rounded px-1.5 py-0.5 bg-[#e2136e] text-white">
      <svg className="h-3 w-3 fill-current" viewBox="0 0 24 24">
        <path d="M12 2L3 9l9 7 9-7-9-7zm0 9.8L6.4 7.2 12 2.8l5.6 4.4L12 11.8zM3 13l9 7 9-7-2-1.5-7 5.5-7-5.5L3 13z" />
      </svg>
      <span className="text-[10px] font-bold tracking-tight">bKash</span>
    </div>
  );
}

function NagadBadge() {
  return (
    <div className="flex items-center gap-1 rounded px-1.5 py-0.5 bg-[#f7941d] text-white">
      <span className="text-[10px] font-black tracking-tight">নগদ</span>
    </div>
  );
}

function CardBadges() {
  return (
    <div className="flex items-center gap-1.5">
      <span className="font-extrabold italic text-[11px] text-[#1a1f71] tracking-tighter">VISA</span>
      <div className="flex items-center -space-x-1.5">
        <div className="h-3.5 w-3.5 rounded-full bg-[#eb001b] opacity-90" />
        <div className="h-3.5 w-3.5 rounded-full bg-[#f79e1b] opacity-90" />
      </div>
    </div>
  );
}

function SslcommerzBadge() {
  return (
    <div className="rounded bg-[#0284c7] px-1.5 py-0.5 text-white">
      <span className="text-[9px] font-black tracking-wider uppercase">SSLCOMMERZ</span>
    </div>
  );
}

function CheckoutPage() {
  const navigate = useNavigate();
  const { slug } = Route.useSearch();
  const { user } = Route.useLoaderData();
  const { cartItems: cartCheckoutItems, getProduct } = useShop();

  const product = slug ? getProduct(slug) : undefined;
  const fallbackProductEntry = product ? [{ product, qty: 1 }] : [];
  const selectedItems = slug ? fallbackProductEntry : cartCheckoutItems;

  const [placedOrder, setPlacedOrder] = useState<OrderRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Address fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [cityDistrict, setCityDistrict] = useState("Dhaka");
  const [shippingPostcode, setShippingPostcode] = useState("1205");
  const [country] = useState("Bangladesh");
  const [useAsBilling, setUseAsBilling] = useState(true);
  const [isEditingAddress, setIsEditingAddress] = useState(false);

  // Methods
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("standard");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");

  // Summary dropdown toggle
  const [summaryExpanded, setSummaryExpanded] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.name) setFullName(user.name);
      if (user.phone) setPhone(user.phone);
      if (user.address) {
        setStreetAddress(user.address);
      } else {
        setStreetAddress("House 12, Road 5, Dhanmondi");
      }
    } else {
      setFullName("S.A Sajid");
      setPhone("+880 1717-123456");
      setStreetAddress("House 12, Road 5, Dhanmondi");
    }
  }, [user]);

  if (selectedItems.length === 0 && !placedOrder) {
    return (
      <main className="mx-auto max-w-[500px] px-4 py-12 text-center">
        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <ShoppingCart className="h-7 w-7" />
          </div>
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Checkout</p>
          <h1 className="mt-2 text-2xl font-black text-gray-900">Your cart is empty</h1>
          <p className="mt-2 text-sm text-gray-500">Add products to your cart to proceed with checkout.</p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
          >
            Continue shopping
          </Link>
        </div>
      </main>
    );
  }

  // Totals calculation
  const totalItemCount = selectedItems.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = selectedItems.reduce((sum, { product: itemProduct, qty: itemQty }) => sum + itemProduct.price * itemQty, 0);

  // Delivery fee logic matching selected option
  const deliveryCharge = deliveryMethod === "pickup" ? 0 : deliveryMethod === "express" ? 120 : 60;
  // Apply discount if applicable (e.g. 200 discount if subtotal exceeds 2000, or matching design)
  const discount = subtotal >= 2000 ? 200 : 0;
  const totalAmount = Math.max(0, subtotal + deliveryCharge - discount);

  const fullShippingAddress = `${streetAddress}, ${cityDistrict} ${shippingPostcode}, ${country}`.trim();

  const handleOrderSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !streetAddress.trim() || !shippingPostcode.trim()) {
      setIsEditingAddress(true);
      toast.error("Please provide a complete delivery address and phone number.");
      return;
    }

    setSubmitting(true);
    try {
      const orderPayload = {
        email: user?.email || "customer@zupona.com",
        items: selectedItems.map(({ product: itemProduct, qty: itemQty }) => ({
          slug: itemProduct.slug,
          name: `${itemProduct.brand} ${itemProduct.name}`,
          qty: itemQty,
          price: itemProduct.price,
        })),
        totalAmount,
        shippingAddress: fullShippingAddress,
        shippingPostcode: shippingPostcode.trim(),
        phone: phone.trim(),
        deliveryMethod,
        discount,
      };

      if (paymentMethod !== "COD") {
        // Online payment methods (bKash, Nagad, Card, SSLCommerz) all seamlessly route via SSLCOMMERZ gateway
        const payment = await startOnlinePayment({ data: orderPayload });
        window.location.assign(payment.paymentUrl);
        return;
      }

      // Cash on Delivery
      const order = await placeOrder({
        data: {
          ...orderPayload,
          paymentMethod: "Cash on Delivery (COD)",
        },
      });

      setPlacedOrder(order);
      toast.success(`Order #${order.id} confirmed!`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      toast.error(err?.message || "Failed to place order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Order Confirmed Screen
  if (placedOrder) {
    return (
      <main className="mx-auto max-w-[440px] px-3.5 py-6 pb-20">
        {/* Header */}
        <header className="flex items-center justify-between py-2">
          <Link
            to="/"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-100"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="text-center">
            <h1 className="text-lg font-black tracking-wider text-emerald-800">ZUPONA</h1>
            <p className="flex items-center justify-center gap-1 text-[11px] font-medium text-emerald-600">
              <ShieldCheck className="h-3 w-3" /> Secure Checkout
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[10px] font-medium text-gray-600">
            <Lock className="h-3 w-3 text-emerald-600" />
            100% Secure
          </div>
        </header>

        {/* Stepper with Complete active */}
        <div className="my-5 flex items-center justify-between px-2">
          {[
            { label: "Cart", icon: ShoppingCart, status: "done" },
            { label: "Checkout", icon: Truck, status: "done" },
            { label: "Confirm", icon: FileText, status: "done" },
            { label: "Complete", icon: Check, status: "active" },
          ].map((step, idx, arr) => (
            <div key={step.label} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm">
                  <step.icon className="h-4 w-4" />
                </div>
                <span className="mt-1 text-[11px] font-bold text-gray-900">{step.label}</span>
              </div>
              {idx < arr.length - 1 && <div className="mx-1.5 h-0.5 flex-1 -mt-4 bg-emerald-500" />}
            </div>
          ))}
        </div>

        {/* Confirmed Card */}
        <div className="rounded-3xl border border-gray-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <PackageCheck className="h-8 w-8" />
          </div>
          <h2 className="mt-4 text-2xl font-black text-gray-900">Order Confirmed!</h2>
          <p className="mt-1 text-xs text-gray-500">Thank you for shopping with Zupona.</p>

          <div className="mt-4 rounded-xl bg-emerald-50/70 p-3 text-center border border-emerald-100">
            <p className="text-[11px] uppercase tracking-wider text-emerald-800 font-semibold">Order ID</p>
            <p className="font-mono text-base font-extrabold text-emerald-700">{placedOrder.id}</p>
          </div>

          <div className="mt-5 space-y-2 rounded-2xl border border-gray-100 bg-gray-50/70 p-3.5 text-left text-xs">
            <div className="flex justify-between gap-2 border-b border-gray-200/60 pb-2">
              <span className="text-gray-500">Recipient:</span>
              <span className="font-bold text-gray-900 text-right">{fullName}</span>
            </div>
            <div className="flex justify-between gap-2 border-b border-gray-200/60 py-2">
              <span className="text-gray-500">Delivery Address:</span>
              <span className="max-w-[200px] font-medium text-gray-900 text-right truncate">{placedOrder.shipping_address}</span>
            </div>
            <div className="flex justify-between gap-2 border-b border-gray-200/60 py-2">
              <span className="text-gray-500">Payment:</span>
              <span className="font-semibold text-gray-900 text-right">{placedOrder.payment_method}</span>
            </div>
            <div className="flex justify-between gap-2 pt-2 text-sm font-black">
              <span className="text-gray-900">Total Payable:</span>
              <span className="text-emerald-600">{formatTk(placedOrder.total_amount)}</span>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2.5">
            <Link
              to="/track-order"
              search={{ id: placedOrder.id }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
            >
              Track Order <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/"
              className="inline-flex w-full items-center justify-center rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[440px] px-3.5 py-4 pb-28 text-gray-900 sm:px-4 sm:py-6">
      {/* 1. TOP HEADER */}
      <header className="flex items-center justify-between pb-3">
        <button
          type="button"
          onClick={() => navigate({ to: "/cart" })}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-100"
          aria-label="Back to Cart"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <div className="text-center">
          <h1 className="text-lg font-black tracking-wider text-[#16a34a]">ZUPONA</h1>
          <p className="flex items-center justify-center gap-1 text-[11px] font-medium text-emerald-600">
            <ShieldCheck className="h-3 w-3" /> Secure Checkout
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[10px] font-medium text-gray-600 shadow-xs">
          <Lock className="h-3 w-3 text-emerald-600" />
          100% Secure
        </div>
      </header>

      {/* 2. STEP PROGRESS BAR */}
      <div className="my-4 flex items-center justify-between px-2">
        {/* Step 1: Cart (Done/Active) */}
        <div className="flex flex-1 items-center">
          <div className="flex flex-col items-center">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-emerald-500 bg-white text-emerald-600">
              <ShoppingCart className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[9px] font-bold text-white">
                {totalItemCount}
              </span>
            </div>
            <span className="mt-1.5 text-[11px] font-medium text-gray-500">Cart</span>
          </div>
          <div className="mx-2 h-0.5 flex-1 -mt-4 bg-emerald-500" />
        </div>

        {/* Step 2: Checkout (Current Active) */}
        <div className="flex flex-1 items-center">
          <div className="flex flex-col items-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm">
              <Truck className="h-4 w-4" />
            </div>
            <span className="mt-1.5 text-[11px] font-bold text-gray-900">Checkout</span>
          </div>
          <div className="mx-2 h-0.5 flex-1 -mt-4 bg-gray-200" />
        </div>

        {/* Step 3: Confirm (Upcoming) */}
        <div className="flex flex-1 items-center">
          <div className="flex flex-col items-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400">
              <FileText className="h-4 w-4" />
            </div>
            <span className="mt-1.5 text-[11px] font-medium text-gray-400">Confirm</span>
          </div>
          <div className="mx-2 h-0.5 flex-1 -mt-4 bg-gray-200" />
        </div>

        {/* Step 4: Complete (Final) */}
        <div className="flex items-center">
          <div className="flex flex-col items-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400">
              <Check className="h-4 w-4" />
            </div>
            <span className="mt-1.5 text-[11px] font-medium text-gray-400">Complete</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleOrderSubmit} className="space-y-4">
        {/* SECTION 1: DELIVERY ADDRESS */}
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">1. Delivery Address</h2>
            <button
              type="button"
              onClick={() => setIsEditingAddress(!isEditingAddress)}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition"
            >
              {isEditingAddress ? "Cancel" : "Change"}
            </button>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <MapPin className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1 text-xs">
                <p className="font-bold text-gray-900 text-sm">{fullName || "Add Recipient Name"}</p>
                <p className="mt-1 text-gray-600 leading-relaxed">{streetAddress || "House, road, area"}</p>
                <p className="text-gray-600">{cityDistrict}, {cityDistrict} {shippingPostcode}</p>
                <p className="text-gray-600">{country}</p>
                <p className="mt-1 font-semibold text-gray-700">{phone || "+880 1XXXXXXXXX"}</p>
              </div>
            </div>

            {/* Inline Address Editor */}
            {isEditingAddress && (
              <div className="mt-3.5 space-y-2.5 border-t border-gray-100 pt-3 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="Recipient name"
                    className="mt-1 h-9 w-full rounded-lg border border-gray-300 px-3 text-xs outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    placeholder="+880 1717-123456"
                    className="mt-1 h-9 w-full rounded-lg border border-gray-300 px-3 text-xs outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700">Street Address</label>
                  <input
                    type="text"
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    required
                    placeholder="House 12, Road 5, Dhanmondi"
                    className="mt-1 h-9 w-full rounded-lg border border-gray-300 px-3 text-xs outline-none focus:border-emerald-600"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-gray-700">City / District</label>
                    <input
                      type="text"
                      value={cityDistrict}
                      onChange={(e) => setCityDistrict(e.target.value)}
                      required
                      placeholder="Dhaka"
                      className="mt-1 h-9 w-full rounded-lg border border-gray-300 px-3 text-xs outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700">Postal Code (4 digits)</label>
                    <input
                      type="text"
                      maxLength={4}
                      value={shippingPostcode}
                      onChange={(e) => setShippingPostcode(e.target.value)}
                      required
                      placeholder="1205"
                      className="mt-1 h-9 w-full rounded-lg border border-gray-300 px-3 text-xs outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingAddress(false)}
                  className="mt-2 w-full rounded-lg bg-emerald-600 py-2 font-bold text-white hover:bg-emerald-700 transition"
                >
                  Save Address
                </button>
              </div>
            )}
          </div>

          <label className="mt-2.5 flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={useAsBilling}
              onChange={(e) => setUseAsBilling(e.target.checked)}
              className="h-4 w-4 rounded accent-emerald-600 cursor-pointer"
            />
            <span className="text-xs text-gray-700 font-medium">Use as billing address</span>
          </label>
        </section>

        {/* SECTION 2: DELIVERY METHOD */}
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">2. Delivery Method</h2>
            <span className="text-xs font-semibold text-emerald-600">Change</span>
          </div>

          <div className="space-y-2">
            {/* Standard Delivery */}
            <div
              onClick={() => setDeliveryMethod("standard")}
              className={`flex items-center justify-between rounded-2xl border p-3.5 cursor-pointer transition ${
                deliveryMethod === "standard"
                  ? "border-emerald-500 bg-emerald-50/40 shadow-xs"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                  deliveryMethod === "standard" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"
                }`}>
                  <Truck className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">Standard Delivery</p>
                  <p className="text-[11px] text-gray-500">Delivery in 2-3 working days</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-900">৳60</span>
                <div className={`flex h-5 w-5 items-center justify-center rounded-full ${
                  deliveryMethod === "standard" ? "bg-emerald-600 text-white" : "border border-gray-300"
                }`}>
                  {deliveryMethod === "standard" && <Check className="h-3 w-3 stroke-[3]" />}
                </div>
              </div>
            </div>

            {/* Express Delivery */}
            <div
              onClick={() => setDeliveryMethod("express")}
              className={`flex items-center justify-between rounded-2xl border p-3.5 cursor-pointer transition ${
                deliveryMethod === "express"
                  ? "border-emerald-500 bg-emerald-50/40 shadow-xs"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                  deliveryMethod === "express" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"
                }`}>
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">Express Delivery</p>
                  <p className="text-[11px] text-gray-500">Delivery in 24 hours</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-900">৳120</span>
                <div className={`flex h-5 w-5 items-center justify-center rounded-full ${
                  deliveryMethod === "express" ? "bg-emerald-600 text-white" : "border border-gray-300"
                }`}>
                  {deliveryMethod === "express" && <Check className="h-3 w-3 stroke-[3]" />}
                </div>
              </div>
            </div>

            {/* Store Pickup */}
            <div
              onClick={() => setDeliveryMethod("pickup")}
              className={`flex items-center justify-between rounded-2xl border p-3.5 cursor-pointer transition ${
                deliveryMethod === "pickup"
                  ? "border-emerald-500 bg-emerald-50/40 shadow-xs"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                  deliveryMethod === "pickup" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"
                }`}>
                  <Store className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">Store Pickup</p>
                  <p className="text-[11px] text-gray-500">Pick up from nearest store</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-900">৳0</span>
                <div className={`flex h-5 w-5 items-center justify-center rounded-full ${
                  deliveryMethod === "pickup" ? "bg-emerald-600 text-white" : "border border-gray-300"
                }`}>
                  {deliveryMethod === "pickup" && <Check className="h-3 w-3 stroke-[3]" />}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: PAYMENT METHOD */}
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">3. Payment Method</h2>
            <span className="text-xs font-semibold text-emerald-600">Change</span>
          </div>

          <div className="space-y-2">
            {/* 1. Cash on Delivery (COD) */}
            <div
              onClick={() => setPaymentMethod("COD")}
              className={`flex items-center justify-between rounded-2xl border p-3.5 cursor-pointer transition ${
                paymentMethod === "COD"
                  ? "border-emerald-500 bg-emerald-50/40 shadow-xs"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                  paymentMethod === "COD" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"
                }`}>
                  <Wallet className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">Cash on Delivery (COD)</p>
                  <p className="text-[11px] text-gray-500">Pay when you receive your order</p>
                </div>
              </div>
              <div className={`flex h-5 w-5 items-center justify-center rounded-full ${
                paymentMethod === "COD" ? "bg-emerald-600 text-white" : "border border-gray-300"
              }`}>
                {paymentMethod === "COD" && <Check className="h-3 w-3 stroke-[3]" />}
              </div>
            </div>

            {/* 2. bKash */}
            <div
              onClick={() => setPaymentMethod("BKASH")}
              className={`flex items-center justify-between rounded-2xl border p-3.5 cursor-pointer transition ${
                paymentMethod === "BKASH"
                  ? "border-emerald-500 bg-emerald-50/40 shadow-xs"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-50 text-[#e2136e]">
                  <span className="text-sm font-black">৳</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">bKash</p>
                  <p className="text-[11px] text-gray-500">Pay with your bKash account</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <BkashBadge />
                <div className={`flex h-5 w-5 items-center justify-center rounded-full ${
                  paymentMethod === "BKASH" ? "bg-emerald-600 text-white" : "border border-gray-300"
                }`}>
                  {paymentMethod === "BKASH" && <Check className="h-3 w-3 stroke-[3]" />}
                </div>
              </div>
            </div>

            {/* 3. Nagad */}
            <div
              onClick={() => setPaymentMethod("NAGAD")}
              className={`flex items-center justify-between rounded-2xl border p-3.5 cursor-pointer transition ${
                paymentMethod === "NAGAD"
                  ? "border-emerald-500 bg-emerald-50/40 shadow-xs"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-[#f7941d]">
                  <span className="text-sm font-black">ন</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">Nagad</p>
                  <p className="text-[11px] text-gray-500">Pay with your Nagad account</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <NagadBadge />
                <div className={`flex h-5 w-5 items-center justify-center rounded-full ${
                  paymentMethod === "NAGAD" ? "bg-emerald-600 text-white" : "border border-gray-300"
                }`}>
                  {paymentMethod === "NAGAD" && <Check className="h-3 w-3 stroke-[3]" />}
                </div>
              </div>
            </div>

            {/* 4. Card / Mobile Banking */}
            <div
              onClick={() => setPaymentMethod("CARD")}
              className={`flex items-center justify-between rounded-2xl border p-3.5 cursor-pointer transition ${
                paymentMethod === "CARD"
                  ? "border-emerald-500 bg-emerald-50/40 shadow-xs"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">Card / Mobile Banking</p>
                  <p className="text-[11px] text-gray-500">Visa, Mastercard, AMEX</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <CardBadges />
                <div className={`flex h-5 w-5 items-center justify-center rounded-full ${
                  paymentMethod === "CARD" ? "bg-emerald-600 text-white" : "border border-gray-300"
                }`}>
                  {paymentMethod === "CARD" && <Check className="h-3 w-3 stroke-[3]" />}
                </div>
              </div>
            </div>

            {/* 5. SSLCommerz (Online Payment) */}
            <div
              onClick={() => setPaymentMethod("SSLCOMMERZ")}
              className={`flex items-center justify-between rounded-2xl border p-3.5 cursor-pointer transition ${
                paymentMethod === "SSLCOMMERZ"
                  ? "border-emerald-500 bg-emerald-50/40 shadow-xs"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                  <Lock className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">SSLCommerz (Online Payment)</p>
                  <p className="text-[11px] text-gray-500">Pay via SSLCommerz gateway</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <SslcommerzBadge />
                <div className={`flex h-5 w-5 items-center justify-center rounded-full ${
                  paymentMethod === "SSLCOMMERZ" ? "bg-emerald-600 text-white" : "border border-gray-300"
                }`}>
                  {paymentMethod === "SSLCOMMERZ" && <Check className="h-3 w-3 stroke-[3]" />}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: ORDER SUMMARY */}
        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
          <div
            onClick={() => setSummaryExpanded(!summaryExpanded)}
            className="flex items-center justify-between cursor-pointer select-none"
          >
            <h2 className="text-sm font-bold text-gray-900">4. Order Summary</h2>
            <div className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
              <span>{totalItemCount} {totalItemCount === 1 ? "Item" : "Items"}</span>
              {summaryExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </div>

          {/* Collapsible item preview list */}
          {summaryExpanded && (
            <div className="mt-3 space-y-2.5 border-t border-gray-100 pt-3">
              {selectedItems.map(({ product: itemProduct, qty: itemQty }) => (
                <div key={itemProduct.slug} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={itemProduct.image}
                      alt={itemProduct.name}
                      className="h-10 w-10 shrink-0 rounded-lg border border-gray-200 object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-gray-900">{itemProduct.name}</p>
                      <p className="text-[11px] text-gray-500">{itemQty} × {formatTk(itemProduct.price)}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-gray-900">{formatTk(itemProduct.price * itemQty)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Main Visual Summary */}
          <div className="mt-3.5 flex items-start gap-3.5">
            {/* Stacked Thumbnail with green badge */}
            <div className="relative shrink-0">
              <div className="h-14 w-14 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                {selectedItems[0]?.product.image ? (
                  <img
                    src={selectedItems[0].product.image}
                    alt="Order items preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-gray-400">
                    <ShoppingCart className="h-6 w-6" />
                  </div>
                )}
              </div>
              <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white shadow-xs">
                {totalItemCount}
              </span>
            </div>

            {/* Price breakdown */}
            <div className="flex-1 space-y-1 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-semibold text-gray-900">{formatTk(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery Charge</span>
                <span className="font-semibold text-gray-900">{deliveryCharge === 0 ? "Free" : formatTk(deliveryCharge)}</span>
              </div>
              <div className="flex justify-between text-emerald-600">
                <span>Discount</span>
                <span className="font-semibold">-{formatTk(discount)}</span>
              </div>
              <div className="border-t border-dashed border-gray-200 pt-1.5 mt-1.5 flex justify-between items-baseline">
                <span className="text-xs font-bold text-gray-900">Total Amount</span>
                <span className="text-base font-extrabold text-emerald-600">{formatTk(totalAmount)}</span>
              </div>
            </div>
          </div>
        </section>
      </form>

      {/* 5. FIXED BOTTOM STICKY BAR */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 px-4 py-3 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] backdrop-blur-sm">
        <div className="mx-auto flex max-w-[440px] items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium text-gray-500">Total Payable</p>
            <p className="text-xl font-black tracking-tight text-gray-900">{formatTk(totalAmount)}</p>
          </div>
          <button
            type="button"
            onClick={() => handleOrderSubmit()}
            disabled={submitting}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
          >
            {submitting ? (
              "Processing..."
            ) : (
              <>
                Continue to Confirm Order
                <ArrowRight className="h-4 w-4 stroke-[2.5]" />
              </>
            )}
          </button>
        </div>
      </div>
    </main>
  );
}
