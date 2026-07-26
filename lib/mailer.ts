import "server-only";

const FROM = () =>
  process.env.EMAIL_FROM || "Hawaiian Vacation Rents <no-reply@hawaiianvacationrents.com>";

export async function sendMail(opts: { to: string; subject: string; html: string }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`[mail:console] to=${opts.to} | ${opts.subject}`);
    return { ok: true, dev: true };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM(), to: opts.to, subject: opts.subject, html: opts.html }),
    });
    if (!res.ok) console.error("[mail] resend error", res.status, await res.text());
    return { ok: res.ok };
  } catch (err) {
    console.error("[mail] send failed", err);
    return { ok: false };
  }
}

export function emailShell(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F6F1E7;font-family:Arial,Helvetica,sans-serif;color:#14313B;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
    <div style="text-align:center;padding-bottom:16px;font-size:18px;font-weight:bold;color:#0B3C49;">Hawaiian Vacation Rents</div>
    <div style="background:#ffffff;border-radius:12px;padding:28px;box-shadow:0 2px 8px rgba(11,60,73,0.08);">
      <h1 style="font-size:20px;margin:0 0 16px;color:#0B3C49;">${title}</h1>
      ${bodyHtml}
    </div>
    <div style="text-align:center;padding-top:16px;font-size:12px;color:#7A8B90;">
      hawaiianvacationrents.com — Hawaii vacation homes, direct from owners.<br/>
      We are a listing platform only and are not a party to any rental transaction.
    </div>
  </div></body></html>`;
}
