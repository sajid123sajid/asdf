import { createFileRoute, redirect } from "@tanstack/react-router";
import { getCurrentUser } from "@/auth";
import { AdminPage } from "./admin";

export const Route = createFileRoute("/admin/dashboard")({
  beforeLoad: async () => {
    const user = await getCurrentUser();
    if (!user) throw redirect({ to: "/login", search: { returnTo: undefined } });
    if (user.role !== "owner") throw redirect({ to: "/account" });
  },
  component: AdminPage,
});
