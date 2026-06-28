// Room join codes: short, uppercase, and free of ambiguous characters
// (no 0/O, 1/I/L) so they're easy to read aloud and type.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;

export function generateRoomCode(): string {
  const bytes = new Uint8Array(CODE_LENGTH);
  crypto.getRandomValues(bytes);
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return code;
}

/** Normalize user-entered codes (trim, uppercase, strip spaces). */
export function normalizeRoomCode(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, "");
}
