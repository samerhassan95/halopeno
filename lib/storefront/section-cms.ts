export type SectionCmsData = Record<string, string | number | boolean | string[] | undefined>;

export function cmsText(data: SectionCmsData | undefined, key: string, fallback: string) {
  const value = data?.[key];
  return typeof value === "string" && value.trim() ? value : fallback;
}

export function cmsNumber(data: SectionCmsData | undefined, key: string, fallback: number) {
  const value = data?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function cmsBool(data: SectionCmsData | undefined, key: string, fallback: boolean) {
  const value = data?.[key];
  return typeof value === "boolean" ? value : fallback;
}
