"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState, useEffect } from "react";
import {
  Button,
  Label,
  Input,
  PasswordInput,
  Checkbox,
  FullScreenLoadingOverlay,
  AlertBanner,
} from "@/components/ui";

function LoginBody() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = searchParams.get("error");
    if (q === "CredentialsSignin" || q) {
      setError("Invalid email or password.");
    }
  }, [searchParams]);

  const canSubmit = useMemo(() => username.trim() && password.trim(), [username, password]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || submitting) return;

    setSubmitting(true);
    setError(null);
    const res = await signIn("credentials", {
      redirect: false,
      username,
      password,
    });

    if (!res?.ok) {
      setSubmitting(false);
      setError("Invalid email or password.");
      return;
    }

    router.replace("/dashboard");
  }

  return (
    <main className="min-h-screen bg-bg text-ink">
      <FullScreenLoadingOverlay open={submitting} label="Signing in" />
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col lg:flex-row">
        {/* Editorial hero */}
        <section className="flex flex-1 flex-col justify-center px-6 py-14 sm:px-10 lg:px-14 lg:py-20 xl:px-20">
          <div className="flex items-center gap-2.5 mb-12 lg:mb-16">
            <svg
              width={32}
              height={32}
              viewBox="0 0 28 28"
              aria-hidden="true"
              className="shrink-0"
            >
              <rect x="2" y="2" width="24" height="24" rx="6" fill="#24584E" />
              <rect x="9" y="9" width="10" height="10" rx="2" fill="#F7F6F2" opacity="0.92" />
            </svg>
            <span className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
              Talent Portal
            </span>
          </div>

          <div className="max-w-lg">
            <div className="flex items-center gap-3 mb-6">
              <span className="h-[2px] w-10 bg-brand rounded-full" aria-hidden />
              <span className="t-label text-stone">Multi-agency platform</span>
            </div>

            <h1 className="font-editorial font-normal leading-[1.05] text-ink tracking-[-0.01em] text-[44px] sm:text-[52px] lg:text-[56px] xl:text-[60px]">
              Welcome back.
              <br />
              <span className="italic text-brand-dark">Good to see you.</span>
            </h1>

            <p className="mt-7 t-body-lg text-graphite max-w-md">
              Sign in to manage profiles, review opportunities, and coordinate with management
              teams — all in one neutral workspace.
            </p>

            <div className="mt-12 grid grid-cols-3 gap-6 max-w-md border-t border-mist pt-8">
              <div>
                <div className="t-h3 text-ink font-semibold">3</div>
                <div className="t-label text-stone mt-1">Management teams</div>
              </div>
              <div>
                <div className="t-h3 text-ink font-semibold">24/7</div>
                <div className="t-label text-stone mt-1">Availability</div>
              </div>
              <div>
                <div className="t-h3 text-ink font-semibold">End‑to‑end</div>
                <div className="t-label text-stone mt-1">Talent workflow</div>
              </div>
            </div>
          </div>
        </section>

        {/* Form card */}
        <section className="flex flex-1 items-center justify-center px-5 py-12 sm:px-8 lg:px-10 lg:py-20 border-t border-mist lg:border-t-0 lg:border-l">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <h2 className="t-h2 text-ink font-semibold">Sign in to your account</h2>
              <p className="mt-2 t-body text-graphite">
                Use the credentials issued by your agency or administrator.
              </p>
            </div>

            {error ? (
              <AlertBanner tone="error" className="mb-6" onDismiss={() => setError(null)}>
                {error}
              </AlertBanner>
            ) : null}

            <form onSubmit={onSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  autoComplete="username"
                  placeholder="your.username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <PasswordInput
                  id="password"
                  autoComplete={rememberMe ? "current-password" : "off"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between gap-4 pt-1">
                <Checkbox
                  id="remember-me"
                  checked={rememberMe}
                  onCheckedChange={(v) => setRememberMe(!!v)}
                  label="Remember me"
                />
                <button
                  type="button"
                  onClick={() => setError("Please contact an administrator to reset your password.")}
                  className="text-[13px] font-medium text-brand-dark hover:text-brand transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={!canSubmit || submitting}
                loading={submitting}
                className="w-full"
              >
                {submitting ? "Signing in…" : "Sign in"}
              </Button>
            </form>

            <div className="mt-10 pt-6 border-t border-mist">
              <p className="t-body-sm text-stone text-center">
                Trouble signing in? Contact your agency administrator for access.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginBody />
    </Suspense>
  );
}
