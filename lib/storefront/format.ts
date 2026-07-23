export function formatSAR(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}
