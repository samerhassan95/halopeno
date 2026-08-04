export function formatSAR(value: number) {
  return formatMoney(value, "SAR", "SAR");
}

export function formatMoney(value: number, currencyCode = "SAR", currencySymbol?: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode || "SAR",
      maximumFractionDigits: value % 1 === 0 ? 0 : 2,
    }).format(value);
  } catch {
    const symbol = currencySymbol || currencyCode || "SAR";
    return `${symbol} ${value.toFixed(value % 1 === 0 ? 0 : 2)}`;
  }
}
