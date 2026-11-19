/** Canonical personal names for display, registration, KYC and bank requests. */
export function formatPersonName(value: string): string {
  return value
    .normalize('NFC')
    .trim()
    .replace(/\s+/gu, ' ')
    .toLocaleLowerCase('es-CO')
    .replace(
      /(^|[\s'’\-])(\p{L})/gu,
      (_, separator: string, letter: string) =>
        separator + letter.toLocaleUpperCase('es-CO'),
    );
}
