import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { Header } from "@/components/zupona/Header";
import { CartDrawer } from "@/components/zupona/CartDrawer";
import { MobileBottomGroup } from "@/components/zupona/MobileBottomGroup";
import { ShopProvider } from "@/components/zupona/shop-store";
import { Toaster } from "@/components/ui/sonner";
import { shouldShowCartDrawer, shouldShowStoreHeader } from "./-checkout-shell";


function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Zupona" },
      { name: "description", content: "Shop premium beauty, fashion, watches, home and baby products at Zupona. Free delivery over Tk 999, 30-day returns and secure checkout." },
      { name: "author", content: "Zupona" },
      { property: "og:title", content: "Zupona — Trusted Online Shop in Bangladesh" },
      { property: "og:description", content: "Shop premium beauty, fashion, watches, home and baby products at Zupona. Free delivery over Tk 999, 30-day returns and secure checkout." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@zupona" },
      { name: "twitter:title", content: "Zupona — Trusted Online Shop in Bangladesh" },
      { name: "twitter:description", content: "Shop premium beauty, fashion, watches, home and baby products at Zupona. Free delivery over Tk 999, 30-day returns and secure checkout." },
      { name: "application-name", content: "Zupona" },
      { name: "apple-mobile-web-app-title", content: "Zupona" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.png", type: "image/png", sizes: "192x192" },
      { rel: "apple-touch-icon", href: "/favicon.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [showInitialLoad, setShowInitialLoad] = useState(true);
  const isAdminRoute = pathname.startsWith("/admin");
  const isAuthRoute = pathname === "/login" || pathname === "/google-callback";
  const isCheckoutLikeRoute = pathname === "/cart" || pathname === "/checkout" || pathname.startsWith("/account");
  const showStoreHeader = shouldShowStoreHeader(pathname);
  const showMobileBottomGroup = !isAdminRoute && !isAuthRoute && !isCheckoutLikeRoute;

  useEffect(() => {
    const timer = window.setTimeout(() => setShowInitialLoad(false), 900);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ShopProvider>
        <div className="min-h-screen bg-background pb-20 md:pb-0">
          {showStoreHeader && <Header />}
          {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
          <Outlet />
          {showMobileBottomGroup && <MobileBottomGroup />}
        </div>
        {shouldShowCartDrawer(pathname) && <CartDrawer />}
        <Toaster />

        {showInitialLoad && (
          <div
            className="pointer-events-none fixed inset-0 z-[999] bg-[#f3f3f3] transition-opacity duration-500 ease-out"
            aria-live="polite"
            aria-busy="true"
          >
            <div className="h-3 w-full bg-[#8ad9e8]" />
            <div className="flex h-[calc(100%-0.75rem)] items-center justify-center">
              <div className="select-none text-[clamp(3.1rem,10vw,8rem)] font-black tracking-[-0.1em] text-[#7e1ea3]">
                zupona
              </div>
            </div>
          </div>
        )}
      </ShopProvider>
    </QueryClientProvider>
  );
}

