export function shouldShowStoreHeader(pathname: string) {
  const isAdminRoute = pathname.startsWith("/admin");
  const isAuthRoute = pathname === "/login" || pathname === "/google-callback";
  const isCheckoutRoute = pathname === "/checkout" || pathname.startsWith("/checkout/");
  return !isAdminRoute && !isAuthRoute && !isCheckoutRoute;
}

export function shouldShowCartDrawer(pathname: string) {
  const isAdminRoute = pathname.startsWith("/admin");
  const isAuthRoute = pathname === "/login" || pathname === "/google-callback";
  const isCheckoutRoute = pathname === "/checkout" || pathname.startsWith("/checkout/");
  return !isAdminRoute && !isAuthRoute && !isCheckoutRoute;
}
