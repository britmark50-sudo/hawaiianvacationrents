import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendMail, emailShell } from "@/lib/mailer";
import { SITE_URL } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const key = req.nextUrl.searchParams.get("key");
    const auth = req.headers.get("authorization");
    if (key !== secret && auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();

  // 1) Expire listings past their end date
  const toExpire = await prisma.property.findMany({
    where: { status: "ACTIVE", expiresAt: { lt: now } },
    include: { owner: true },
  });
  if (toExpire.length > 0) {
    await prisma.property.updateMany({
      where: { id: { in: toExpire.map((p) => p.id) } },
      data: { status: "EXPIRED" },
    });
    for (const p of toExpire) {
      await sendMail({
        to: p.owner.email,
        subject: `Your listing "${p.title}" has expired`,
        html: emailShell(
          "Your listing has expired",
          `<p>Your 30-day listing period for <strong>${p.title}</strong> has ended and the listing is no longer visible to travelers.</p>
           <p>Renew it in one click to get back online for another 30 days ($5).</p>
           <p style="margin-top:20px;"><a href="${SITE_URL}/dashboard" style="background:#EF6349;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;">Renew my listing</a></p>`
        ),
      });
    }
  }

  // 2) Remind owners whose listings expire within 5 days
  const soon = new Date(now.getTime() + 5 * 86400000);
  const toRemind = await prisma.property.findMany({
    where: { status: "ACTIVE", reminderSent: false, expiresAt: { gte: now, lte: soon } },
    include: { owner: true },
  });
  for (const p of toRemind) {
    await sendMail({
      to: p.owner.email,
      subject: `Your listing "${p.title}" expires on ${formatDate(p.expiresAt)}`,
      html: emailShell(
        "Your listing expires soon",
        `<p><strong>${p.title}</strong> will go offline on <strong>${formatDate(p.expiresAt)}</strong>.</p>
         <p>Renew now for $5 to keep it visible without interruption — your remaining days are always kept.</p>
         <p style="margin-top:20px;"><a href="${SITE_URL}/dashboard" style="background:#EF6349;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;">Renew my listing</a></p>`
      ),
    });
  }
  if (toRemind.length > 0) {
    await prisma.property.updateMany({
      where: { id: { in: toRemind.map((p) => p.id) } },
      data: { reminderSent: true },
    });
  }

  if (toExpire.length > 0) {
    try {
      revalidatePath("/");
      revalidatePath("/search");
    } catch {}
  }

  return NextResponse.json({ expired: toExpire.length, reminded: toRemind.length });
}
