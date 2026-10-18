import { NextResponse, type NextRequest } from "next/server";
import { BRAND_COOKIE_NAME, BRAND_IDS } from "./lib/brand-header";

/**
 * Resolve the brand for this request (?brand= → lc-demo-brand cookie → achieve) and rewrite
 * to the matching statically generated variant, e.g. /mortgage?brand=fdr → /fdr/mortgage.
 * The URL in the browser is unchanged. Pages under app/[brand] are prerendered per brand
 * (generateStaticParams) with ISR, so the root layout no longer reads headers()/cookies()
 * (M1) and the first paint is still the right brand (no Achieve→brand swap).
 */
const BRANDS = new Set<string>(BRAND_IDS);

export function proxy(request: NextRequest) {
  const fromQuery = request.nextUrl.searchParams.get("brand");
  const fromCookie = request.cookies.get(BRAND_COOKIE_NAME)?.value;
  const brand = fromQuery && BRANDS.has(fromQuery) ? fromQuery : fromCookie && BRANDS.has(fromCookie) ? fromCookie : "achieve";
  const url = request.nextUrl.clone();
  url.pathname = `/${brand}${url.pathname === "/" ? "" : url.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon.png|icon-192.png|apple-touch-icon.png|robots.txt|sitemap.xml).*)"],
};
