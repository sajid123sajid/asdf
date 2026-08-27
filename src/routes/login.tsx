import { createFileRoute, redirect } from "@tanstack/react-router";
import { getCurrentUser } from "@/auth";
import { AuthPanel } from "@/components/zupona/AuthPanel";

export const Route = createFileRoute("/login")({
  beforeLoad: async () => {
    const user = await getCurrentUser();
    if (user) throw redirect({ to: user.role === "owner" ? "/admin/dashboard" : "/account" });
  },
  head: () => ({
    meta: [{ title: "Sign In — Zupona" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <AuthPanel />
    </main>
  );
}
