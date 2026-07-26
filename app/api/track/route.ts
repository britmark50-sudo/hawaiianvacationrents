import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const propertyId = String(body.propertyId || "");
    const kind = String(body.kind || "");
    if (!propertyId || !["view", "contact"].includes(kind)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    await prisma.property.update({
      where: { id: propertyId },
      data: kind === "view" ? { views: { increment: 1 } } : { contactClicks: { increment: 1 } },
    });
  } catch {
    // swallow — tracking must never break the page
  }
  return NextResponse.json({ ok: true });
}
