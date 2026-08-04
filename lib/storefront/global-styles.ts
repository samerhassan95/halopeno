export interface GlobalStylesConfig {
  primary: string;
  accent: string;
  background: string;
  radius: string;
  secondary?: string;
  text?: string;
  mutedText?: string;
  border?: string;
  headingFont?: string;
  bodyFont?: string;
  baseFontSize?: number;
  lineHeight?: number;
  buttonRadius?: number;
  cardRadius?: number;
  containerWidth?: number;
  sectionPadding?: number;
  customCss?: string;
}

export const DEFAULT_GLOBAL_STYLES: GlobalStylesConfig = {
  primary: "#124b2d",
  accent: "#b52a24",
  background: "#ffffff",
  radius: "1.5rem",
};

/** Build CSS custom-property overrides for the live storefront theme. */
export function buildStorefrontStyleVars(overrides: Partial<GlobalStylesConfig> | null | undefined): string {
  if (!overrides) return "";
  const lines: string[] = [];
  if (overrides.primary) lines.push(`--primary: ${overrides.primary};`);
  if (overrides.accent) {
    lines.push(`--accent: ${overrides.accent};`);
    lines.push(`--destructive: ${overrides.accent};`);
  }
  if (overrides.secondary) lines.push(`--secondary: ${overrides.secondary};`);
  if (overrides.background) lines.push(`--background: ${overrides.background};`);
  if (overrides.text) lines.push(`--foreground: ${overrides.text};`);
  if (overrides.mutedText) lines.push(`--muted-foreground: ${overrides.mutedText};`);
  if (overrides.border) lines.push(`--border: ${overrides.border};`);
  if (overrides.radius) lines.push(`--radius: ${overrides.radius};`);
  else if (overrides.cardRadius != null) lines.push(`--radius: ${overrides.cardRadius}px;`);
  if (overrides.buttonRadius != null) lines.push(`--button-radius: ${overrides.buttonRadius}px;`);
  if (overrides.baseFontSize != null) lines.push(`--font-size-base: ${overrides.baseFontSize}px;`);
  if (overrides.lineHeight != null) lines.push(`--line-height: ${overrides.lineHeight};`);
  if (overrides.headingFont) lines.push(`--font-heading: ${overrides.headingFont}, sans-serif;`);
  if (overrides.bodyFont) lines.push(`--font-sans: ${overrides.bodyFont}, sans-serif;`);
  if (overrides.containerWidth != null) lines.push(`--container-width: ${overrides.containerWidth}px;`);
  if (overrides.sectionPadding != null) lines.push(`--section-padding: ${overrides.sectionPadding}px;`);
  return lines.join("\n            ");
}
