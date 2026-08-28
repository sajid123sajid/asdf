import { createFileRoute, redirect } from "@tanstack/react-router";
import { getCurrentUser } from "@/auth";
import { AuthPanel } from "@/components/zupona/AuthPanel";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    returnTo: typeof search["returnTo"] === "string" && search["returnTo"].startsWith("/") && !search["returnTo"].startsWith("//")
      ? search["returnTo"] as string
      : undefined,
  }),
  beforeLoad: async ({ search }) => {
    const user = await getCurrentUser();
    if (user) {
      throw redirect({ to: search.returnTo || (user.role === "owner" ? "/admin/dashboard" : "/account") });
    }
  },
  head: () => ({
    meta: [{ title: "Sign In — Zupona" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { returnTo } = Route.useSearch();
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <AuthPanel {...(returnTo ? { redirectTo: returnTo } : {})} />
    </main>
  );
}
