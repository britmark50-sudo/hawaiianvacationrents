import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "hvr_session";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;

  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("next", pathname);

  if (!token) return NextResponse.redirect(loginUrl);

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.SESSION_SECRET || "hvr-dev-secret")
    );
    if (pathname.startsWith("/admin") && payload.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
