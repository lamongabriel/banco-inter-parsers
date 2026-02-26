const MONTHS: { [key: string]: string } = {
  janeiro: "01",
  fevereiro: "02",
  "março": "03",
  abril: "04",
  maio: "05",
  junho: "06",
  julho: "07",
  agosto: "08",
  setembro: "09",
  outubro: "10",
  novembro: "11",
  dezembro: "12",
};

export function normalizeDate(text: string): string | null {
  const match = text.match(/(\d{1,2}) de ([a-zç]+) de (\d{4})/i);
  if (!match) return null;

  const day = match[1].padStart(2, "0");
  const month = MONTHS[match[2].toLowerCase()];
  const year = match[3];

  if (!month) return null;

  return `${year}-${month}-${day}`;
}
