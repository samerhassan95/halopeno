import type { SalesPoint } from "@/types";

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function buildSeries(days: number, seedBase: number): SalesPoint[] {
  const rand = seededRandom(seedBase);
  const points: SalesPoint[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const base = 280 + Math.sin(i / 4) * 60 + rand() * 90;
    const revenue = Math.round(base);
    const inHouseSales = revenue;
    const sellerSales = 0;
    const refunds = Math.round(revenue * (0.01 + rand() * 0.02));
    const orders = Math.max(1, Math.round(revenue / 55));
    points.push({
      date: d.toISOString(),
      revenue,
      orders,
      inHouseSales,
      sellerSales,
      grossRevenue: revenue,
      netRevenue: revenue - refunds,
      refunds,
    });
  }
  return points;
}

export const salesDaily = buildSeries(30, 11);
export const salesWeekly = buildSeries(12, 22);
export const salesMonthly = buildSeries(12, 33);
export const salesYearly = buildSeries(6, 44);

export const salesByRange = {
  daily: salesDaily,
  weekly: salesWeekly,
  monthly: salesMonthly,
  yearly: salesYearly,
};

export const totalAllTimeSales = 23_440;
export const salesThisMonth = 4_860;
export const salesThisYear = 23_440;
export const inHouseSalesTotal = 23_440;
export const sellerSalesTotal = 0;
