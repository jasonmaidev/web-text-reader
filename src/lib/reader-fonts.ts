export const readerFonts = {
  manrope: { label: "Manrope", family: '"Manrope Variable", sans-serif' },
  "open-sans": { label: "Open Sans", family: '"Open Sans Variable", sans-serif' },
  inter: { label: "Inter", family: '"Inter Variable", sans-serif' },
} as const;

export type ReaderFont = keyof typeof readerFonts;

export function isReaderFont(value: unknown): value is ReaderFont {
  return typeof value === "string" && Object.hasOwn(readerFonts, value);
}
