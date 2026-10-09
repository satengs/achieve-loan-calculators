import { NextResponse, type NextRequest } from "next/server";

/**
 * Forward the requested brand (?brand=) to the server render as a request header so the
 * initial HTML is already themed for that brand (no Achieve→brand swap after hydration).
 */
import { BRAND_HEADER, TAB_HEADER } from "./lib/brand-header";
const BRANDS = new Set(["achieve", "fdr", "bills"]);

export function proxy(request: NextRequest) {
  const brand = request.nextUrl.searchParams.get("brand");
  const headers = new Headers(request.headers);
  headers.delete(BRAND_HEADER);
  if (brand && BRANDS.has(brand)) headers.set(BRAND_HEADER, brand);
  headers.delete(TAB_HEADER);
  if (request.nextUrl.searchParams.get("tab") === "tech") headers.set(TAB_HEADER, "tech");
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon.png|icon-192.png|apple-touch-icon.png).*)"],
};
