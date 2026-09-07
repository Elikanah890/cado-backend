const COMMON_WEAK_PASSWORDS = new Set([
  'password',
  'password123',
  'Password123!',
  'SecurePassword123!',
  'admin',
  'admin123',
  'Admin123!',
  'changeme',
  '12345678',
  '123456789',
  'qwerty123',
  'letmein123',
]);

export function isWeakPassword(password: string): boolean {
  if (typeof password !== 'string') return true;
  const trimmed = password.trim();
  if (trimmed.length < 8) return true;
  if (COMMON_WEAK_PASSWORDS.has(password) || COMMON_WEAK_PASSWORDS.has(trimmed)) return true;
  return false;
}
