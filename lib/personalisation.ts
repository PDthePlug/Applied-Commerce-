export type AppearancePreference = "system" | "light" | "warm" | "dark";
export type AccentPreference = "commerce" | "blue" | "amber" | "sage";
export type TextSizePreference = "small" | "standard" | "large" | "extra_large";
export type ReadingWidthPreference = "narrow" | "standard" | "wide";

export type Personalisation = {
  appearance: AppearancePreference;
  accent: AccentPreference;
  textSize: TextSizePreference;
  readingWidth: ReadingWidthPreference;
};

export const DEFAULT_PERSONALISATION: Personalisation = {
  appearance: "system",
  accent: "commerce",
  textSize: "standard",
  readingWidth: "standard",
};

const appearances = new Set<AppearancePreference>(["system", "light", "warm", "dark"]);
const accents = new Set<AccentPreference>(["commerce", "blue", "amber", "sage"]);
const textSizes = new Set<TextSizePreference>(["small", "standard", "large", "extra_large"]);
const readingWidths = new Set<ReadingWidthPreference>(["narrow", "standard", "wide"]);

export function normalisePersonalisation(value: Partial<Personalisation> | null | undefined): Personalisation {
  return {
    appearance: appearances.has(value?.appearance as AppearancePreference) ? value!.appearance! : DEFAULT_PERSONALISATION.appearance,
    accent: accents.has(value?.accent as AccentPreference) ? value!.accent! : DEFAULT_PERSONALISATION.accent,
    textSize: textSizes.has(value?.textSize as TextSizePreference) ? value!.textSize! : DEFAULT_PERSONALISATION.textSize,
    readingWidth: readingWidths.has(value?.readingWidth as ReadingWidthPreference) ? value!.readingWidth! : DEFAULT_PERSONALISATION.readingWidth,
  };
}

export function applyPersonalisation(value: Personalisation) {
  if (typeof document === "undefined") return;
  const resolved = normalisePersonalisation(value);
  const root = document.documentElement;
  root.dataset.acAppearance = resolved.appearance;
  root.dataset.acAccent = resolved.accent;
  root.dataset.acTextSize = resolved.textSize;
  root.dataset.acReadingWidth = resolved.readingWidth;
}
