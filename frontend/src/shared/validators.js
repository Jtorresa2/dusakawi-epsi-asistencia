// Shared input helpers.
// Keep only digits (used for identification numbers and phone fields).
export function onlyDigits(value) {
  return String(value ?? "").replace(/\D/g, "");
}
