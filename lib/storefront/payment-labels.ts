export const paymentMethodLabels: Record<string, string> = {
  cod: "Cash on Delivery",
  card: "Credit / Debit Card",
  apple_pay: "Apple Pay",
  google_pay: "Google Pay",
  wallet: "Wallet Balance",
};

export function paymentMethodLabel(value: string): string {
  return paymentMethodLabels[value] ?? value;
}
