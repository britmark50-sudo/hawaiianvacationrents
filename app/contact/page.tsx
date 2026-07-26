import type { Metadata } from "next";
import { Mail, MapPin, Clock, Linkedin } from "lucide-react";
import { SOCIAL_LINKS } from "@/lib/constants";
import { ContactForm } from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Questions about a listing, your account or partnering with Hawaiian Vacation Rents? Get in touch.",
};

export default function ContactPage() {
  return (
    <div className="shell py-14">
      <div className="max-w-2xl">
        <p className="eyebrow">We answer with aloha</p>
        <h1 className="section-title mt-2">Contact us</h1>
        <p className="mt-3 text-ink/65">
          Questions about a listing, your owner account, billing, or press &amp; partnerships —
          drop us a note and we will get back to you.
        </p>
      </div>
      <div className="mt-10 grid items-start gap-10 lg:grid-cols-[1fr_340px]">
        <ContactForm />
        <div className="card space-y-5 p-7 text-sm text-ink/70">
          <p className="flex items-start gap-3">
            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
            <span>
              <strong className="block text-deep">Email</strong>
              aloha@hawaiianvacationrents.com
            </span>
          </p>
          <p className="flex items-start gap-3">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
            <span>
              <strong className="block text-deep">Response time</strong>
              Within 1 business day (HST)
            </span>
          </p>
          <p className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
            <span>
              <strong className="block text-deep">Serving</strong>
              Oʻahu · Maui · Kauaʻi · Big Island
            </span>
          </p>
          <p className="flex items-start gap-3">
            <Linkedin className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
            <span>
              <strong className="block text-deep">LinkedIn</strong>
              <a
                href={SOCIAL_LINKS.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal hover:underline"
              >
                Connect with the founder ↗
              </a>
            </span>
          </p>
          <div className="rounded-xl bg-teal-light px-4 py-3 text-xs leading-relaxed text-teal-dark">
            <strong className="block text-deep">Listing fee payments — we accept:</strong>
            <span className="mt-1 block">
              💳 <strong>PayPal</strong> &nbsp;·&nbsp; 🪙 <strong>USDT (TRC20)</strong>
            </span>
            <span className="mt-1 block text-teal-dark/80">
              Exact payment details are shown at checkout when you publish or renew a listing.
              Listings go live automatically once payment is confirmed.
            </span>
          </div>
          <div className="rounded-xl bg-sand px-4 py-3 text-xs leading-relaxed">
            Reporting a problem with a specific listing? Use the{" "}
            <strong>“Report this listing”</strong> link on the listing page so our moderators
            get the full context.
          </div>
        </div>
      </div>
    </div>
  );
}
