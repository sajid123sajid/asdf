import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";
import { completeGoogleLogin } from "../auth";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Google sign-in failed.";
}

export const Route = createFileRoute("/google-callback")({
  component: GoogleCallbackPage,
});

function GoogleCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const state = params.get("state");

      if (!code || !state) {
        toast.error("Google sign-in was cancelled or the callback was invalid.");
        router.navigate({ to: "/account" });
        return;
      }

      try {
        const result = await completeGoogleLogin({ data: { code, state } });
        toast.success("Signed in with Google successfully.");
        await router.invalidate();
        await router.navigate({ to: result.returnTo || (result.user.role === "owner" ? "/admin/dashboard" : "/account") });
      } catch (error: unknown) {
        toast.error(errorMessage(error));
        router.navigate({ to: "/account" });
      }
    };

    void run();
  }, [router]);

  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gold/10 text-lg font-bold text-gold">
          G
        </div>
        <h1 className="mt-4 text-lg font-bold text-foreground">Finishing Google sign-in...</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Please wait while we verify your account and redirect you back to Zupona.
        </p>
      </div>
    </main>
  );
}
