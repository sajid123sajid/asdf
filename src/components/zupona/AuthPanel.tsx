import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { authenticate, getGoogleAuthUrl } from "@/auth";

type AuthMode = "signin" | "signup";

export function AuthPanel({
  onClose,
  initialMode = "signin",
}: {
  onClose?: () => void;
  initialMode?: AuthMode;
}) {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const handleAuth = async (event: React.FormEvent) => {
    event.preventDefault();
    setAuthLoading(true);
    try {
      const result = await authenticate({
        data: { email, password, name, phone, address, mode: authMode },
      });
      toast.success(
        result.status === "signed_up"
          ? "Account created successfully! Welcome to Zupona."
          : "Signed in successfully!",
      );
      onClose?.();
      await router.invalidate();
      await router.navigate({ to: result.user.role === "owner" ? "/admin/dashboard" : "/account" });
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Authentication failed. Please check your credentials.",
      );
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      window.location.href = await getGoogleAuthUrl();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Google sign-in is not available yet.");
    }
  };

  return (
    <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
      <div className="mb-6 flex rounded-lg bg-secondary p-1">
        <button
          type="button"
          onClick={() => setAuthMode("signin")}
          className={`flex-1 rounded-md py-1.5 text-xs font-bold transition-all ${authMode === "signin" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"}`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => setAuthMode("signup")}
          className={`flex-1 rounded-md py-1.5 text-xs font-bold transition-all ${authMode === "signup" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"}`}
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
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
        >
          <span className="text-base">G</span>
          Continue with Google
        </button>
        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            <span className="bg-card px-2">or</span>
          </div>
        </div>

        {authMode === "signup" && (
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-lg border border-border bg-background p-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-gold"
              placeholder="e.g. Sajid Ahmed"
            />
          </div>
        )}
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Email Address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-lg border border-border bg-background p-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-gold"
            placeholder="your@email.com"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-lg border border-border bg-background p-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-gold"
            placeholder="••••••••"
          />
        </div>
        {authMode === "signup" && (
          <>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="w-full rounded-lg border border-border bg-background p-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-gold"
                placeholder="01700000000"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Delivery Address (Optional)
              </label>
              <input
                type="text"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                className="w-full rounded-lg border border-border bg-background p-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-gold"
                placeholder="Dhaka, Bangladesh"
              />
            </div>
          </>
        )}
        <button
          type="submit"
          disabled={authLoading}
          className="w-full rounded-lg bg-gold py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-gold-deep shadow-sm disabled:opacity-50"
        >
          {authLoading ? "Processing..." : authMode === "signin" ? "Sign In" : "Create Account"}
        </button>
      </form>
    </div>
  );
}
