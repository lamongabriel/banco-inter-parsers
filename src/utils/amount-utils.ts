export function normalizeAmount(text: string): number | null {
  const match = text.match(/([+-])US\$ ([\d.,]+)/);
  if (!match) return null;

  const sign = match[1] === "-" ? -1 : 1;
  const value = parseFloat(match[2].replace(/\./g, "").replace(",", "."));

  return sign * value;
}
