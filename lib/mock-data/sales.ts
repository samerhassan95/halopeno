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
    const base = 4200 + Math.sin(i / 4) * 900 + rand() * 1400;
    const revenue = Math.round(base);
    const inHouseSales = Math.round(revenue * (0.42 + rand() * 0.08));
    const sellerSales = revenue - inHouseSales;
    const refunds = Math.round(revenue * (0.02 + rand() * 0.03));
    const grossRevenue = revenue;
    const netRevenue = grossRevenue - refunds;
    const orders = Math.round(revenue / (32 + rand() * 10));
    points.push({
      date: d.toISOString(),
      revenue,
      orders,
      inHouseSales,
      sellerSales,
      grossRevenue,
      netRevenue,
      refunds,
    });
  }
  return points;
}

export const salesDaily = buildSeries(30, 11);
export const salesWeekly = buildSeries(12, 22).map((p, i) => ({ ...p, date: p.date }));
export const salesMonthly = buildSeries(12, 33);
export const salesYearly = buildSeries(6, 44);

export const salesByRange = {
  daily: salesDaily,
  weekly: salesWeekly,
  monthly: salesMonthly,
  yearly: salesYearly,
};

export const totalAllTimeSales = 4_286_940;
export const salesThisMonth = 312_480;
export const salesThisYear = 2_148_600;
export const inHouseSalesTotal = 1_824_200;
export const sellerSalesTotal = totalAllTimeSales - inHouseSalesTotal;
