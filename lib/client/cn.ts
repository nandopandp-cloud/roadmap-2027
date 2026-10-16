/** Junta classes condicionais, ignorando valores falsos. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(value: string | undefined | null, opts: Intl.DateTimeFormatOptions = { dateStyle: "medium" }) {
  if (!value) return "";
  // Datas AAAA-MM-DD são tratadas como datas locais (sem deslocamento de fuso).
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", opts).format(date);
}

export function formatDateTime(value: string) {
  return formatDate(value, { dateStyle: "short", timeStyle: "short" });
}

export function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}
