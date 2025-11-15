// Simple client-side password hashing and verification
// Admin password is stored as a salted sha256 hash. Default password is Itz...6pr
// Salt is public; keep it stable so hash is deterministic across devices.

export const PASSWORD_SALT = 'school-2025-cyberpunk'
// Precomputed: sha256(salt + 'Itz...6pr')
export const ADMIN_PASSWORD_HASH = '12a72bba07b1b44357bcc558efe024c8ee8b1bf9bf229f7c29301e1e7e8cc0d8'

export async function sha256Hex(str) {
  const enc = new TextEncoder().encode(str)
  const buf = await crypto.subtle.digest('SHA-256', enc)
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function verifyPassword(input) {
  const hash = await sha256Hex(PASSWORD_SALT + input)
  return hash === ADMIN_PASSWORD_HASH
}
