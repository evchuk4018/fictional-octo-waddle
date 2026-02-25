"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createSupabaseBrowserClient } from "../../lib/supabase";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters")
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <Card className="w-full space-y-4">
        <header className="space-y-1 text-center">
          <h1 className="text-xl font-semibold text-text-primary">Goal Tracker</h1>
          <p className="text-sm text-text-secondary">Track big goals, milestones, and daily execution.</p>
        </header>

        <form
          className="space-y-3"
          onSubmit={handleSubmit(async (values) => {
            setError(null);

            if (mode === "signin") {
              const { error: signInError } = await supabase.auth.signInWithPassword(values);
              if (signInError) {
                setError(signInError.message);
                return;
              }
            } else {
              const { error: signUpError } = await supabase.auth.signUp(values);
              if (signUpError) {
                setError(signUpError.message);
                return;
              }
            }

            router.replace("/dashboard");
          })}
        >
          <label className="space-y-1 text-sm">
            <span className="text-text-secondary">Email</span>
            <Input type="email" {...register("email")} aria-invalid={Boolean(errors.email)} placeholder="you@example.com" />
            {errors.email ? <p className="text-xs text-red-600">{errors.email.message}</p> : null}
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-text-secondary">Password</span>
            <Input type="password" {...register("password")} aria-invalid={Boolean(errors.password)} />
            {errors.password ? <p className="text-xs text-red-600">{errors.password.message}</p> : null}
          </label>

          {error ? (
            <p role="alert" className="rounded-button border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Please wait..." : mode === "signin" ? "Sign In" : "Create Account"}
          </Button>
        </form>

        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={async () => {
            const { error: oauthError } = await supabase.auth.signInWithOAuth({
              provider: "google",
              options: {
                redirectTo: `${window.location.origin}/dashboard`
              }
            });
            if (oauthError) {
              setError(oauthError.message);
            }
          }}
        >
          Continue with Google
        </Button>

        <button
          type="button"
          className="w-full text-sm font-medium text-primary"
          onClick={() => setMode((prev) => (prev === "signin" ? "signup" : "signin"))}
        >
          {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </Card>
    </div>
  );
}
