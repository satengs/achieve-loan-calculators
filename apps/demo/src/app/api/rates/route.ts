import { getMarketRates } from "@/lib/rates";

/** GET /api/rates → { rates: { key: {value, asOf, source, sourceUrl, seriesId} }, errors, mode, fetchedAt } */
export const revalidate = 86400;

export async function GET() {
  const payload = await getMarketRates();
  return Response.json(payload, {
    headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600" },
  });
}
