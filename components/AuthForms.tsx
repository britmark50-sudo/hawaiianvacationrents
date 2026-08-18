"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, signup, type AuthState } from "@/actions/auth";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(login, undefined);
  return (
    <form action={action} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}
      <div>
        <label className="label" htmlFor="l-email">Email</label>
        <input id="l-email" name="email" type="email" required autoComplete="email" className="input" placeholder="you@example.com" />
      </div>
      <div>
        <label className="label" htmlFor="l-password">Password</label>
        <input id="l-password" name="password" type="password" required autoComplete="current-password" className="input" placeholder="••••••••" />
      </div>
      {state?.error && <p className="text-sm font-medium text-coral">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Logging in…" : "Log in"}
      </button>
      <p className="text-center text-sm text-ink/60">
        New here?{" "}
        <Link href="/signup" className="font-semibold text-teal hover:underline">
          Create an owner account
        </Link>
      </p>
    </form>
  );
}
export function SignupForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(signup, undefined);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label" htmlFor="s-name">Full name</label>
        <input id="s-name" name="name" required autoComplete="name" className="input" placeholder="Leilani Kahale" />
      </div>
      
      <div>
        <label className="label" htmlFor="s-email">Email</label>
        <input id="s-email" name="email" type="email" required autoComplete="email" className="input" placeholder="you@example.com" />
      </div>
      
      <div>
        <label className="label" htmlFor="s-password">Password</label>
        <input id="s-password" name="password" type="password" required minLength={8} autoComplete="new-password" className="input" placeholder="At least 8 characters" />
      </div>
      
      <div>
        <label className="label" htmlFor="s-confirm-password">Confirm password</label>
        <input id="s-confirm-password" name="confirmPassword" type="password" required autoComplete="new-password" className="input" placeholder="Re-enter your password" />
      </div>
      
      {state?.error && <p className="text-sm font-medium text-coral">{state.error}</p>}
      
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Creating account…" : "Create account"}
      </button>
      
      <p className="text-center text-sm text-ink/60">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-teal hover:underline">Log in</Link>
      </p>
    </form>
  );
}
  
    
      
