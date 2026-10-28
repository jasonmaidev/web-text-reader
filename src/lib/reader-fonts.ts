export const readerFonts = {
  manrope: { label: "Manrope", family: '"Manrope Variable", sans-serif' },
  "open-sans": { label: "Open Sans", family: '"Open Sans Variable", sans-serif' },
  "source-sans-3": { label: "Source Sans 3", family: '"Source Sans 3 Variable", sans-serif' },
  "nunito-sans": { label: "Nunito Sans", family: '"Nunito Sans Variable", sans-serif' },
  "dm-sans": { label: "DM Sans", family: '"DM Sans Variable", sans-serif' },
  roboto: { label: "Roboto", family: '"Roboto Variable", sans-serif' },
  inter: { label: "Inter", family: '"Inter Variable", sans-serif' },
} as const;

export type ReaderFont = keyof typeof readerFonts;

export function isReaderFont(value: unknown): value is ReaderFont {
  return typeof value === "string" && Object.hasOwn(readerFonts, value);
}
