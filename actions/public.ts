"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { REPORT_REASONS } from "@/lib/constants";
import { sendFormspree } from "@/lib/formspree";

export type PublicFormState = { ok?: boolean; error?: string } | undefined;

const reportSchema = z.object({
  propertyId: z.string().min(1),
  reason: z.string().refine((r) => REPORT_REASONS.some((x) => x.key === r), "Please choose a reason."),
  details: z.string().trim().max(2000).optional().or(z.literal("")),
  reporterEmail: z.string().trim().toLowerCase().email("Please enter a valid email.").optional().or(z.literal("")),
});

export async function submitReport(_prev: PublicFormState, formData: FormData): Promise<PublicFormState> {
  const parsed = reportSchema.safeParse({
    propertyId: formData.get("propertyId"),
    reason: formData.get("reason"),
    details: formData.get("details"),
    reporterEmail: formData.get("reporterEmail"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Please check the form." };

  const property = await prisma.property.findUnique({ where: { id: parsed.data.propertyId } });
  if (!property) return { error: "Listing not found." };

  await prisma.report.create({
    data: {
      propertyId: property.id,
      reason: parsed.data.reason,
      details: parsed.data.details || null,
      reporterEmail: parsed.data.reporterEmail || null,
    },
  });
  return { ok: true };
}

const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name."),
  email: z.string().trim().toLowerCase().email("Please enter a valid email."),
  subject: z.string().trim().max(140).optional().or(z.literal("")),
  message: z.string().trim().min(10, "Message must be at least 10 characters.").max(4000),
});

export async function submitContactMessage(_prev: PublicFormState, formData: FormData): Promise<PublicFormState> {
  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    subject: formData.get("subject"),
    message: formData.get("message"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Please check the form." };

  await prisma.contactMessage.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      subject: parsed.data.subject || null,
      message: parsed.data.message,
    },
  });

  // Parallel email delivery via Formspree (also kept in the admin inbox)
  await sendFormspree({
    _subject: `Contact form — ${parsed.data.subject || "New message"} (hawaiianvacationrents.com)`,
    form: "contact",
    name: parsed.data.name,
    email: parsed.data.email,
    subject: parsed.data.subject || "",
    message: parsed.data.message,
  });

  return { ok: true };
}
