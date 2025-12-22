export function formatLKR(amount: number | string | undefined | null) {
  const val = Number(amount || 0);
  try {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      maximumFractionDigits: 2,
    }).format(val);
  } catch (e) {
    // Fallback
    return `LKR ${val.toFixed(2)}`;
  }
}
