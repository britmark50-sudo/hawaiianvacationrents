"use client";

import { useActionState } from "react";
import { submitContactMessage, type PublicFormState } from "@/actions/public";
import { CheckCircle2 } from "lucide-react";

export function ContactForm() {
  const [state, action, pending] = useActionState<PublicFormState, FormData>(
    submitContactMessage,
    undefined
  );

  if (state?.ok) {
    return (
      <div className="card p-10 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-teal" />
        <h2 className="mt-4 font-display text-2xl font-semibold text-deep">Message sent</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-ink/60">
          Mahalo for reaching out — we usually reply within one business day.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="card space-y-5 p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="c-name">Name</label>
          <input id="c-name" name="name" required className="input" placeholder="Your name" />
        </div>
        <div>
          <label className="label" htmlFor="c-email">Email</label>
          <input id="c-email" name="email" type="email" required className="input" placeholder="you@example.com" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="c-subject">Subject (optional)</label>
        <input id="c-subject" name="subject" className="input" placeholder="What's this about?" />
      </div>
      <div>
        <label className="label" htmlFor="c-message">Message</label>
        <textarea id="c-message" name="message" rows={6} required className="input" placeholder="How can we help?" />
      </div>
      {state?.error && <p className="text-sm font-medium text-coral">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
