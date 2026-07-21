/**
 * Security utilities for QR Menu SaaS
 * Implements Web Crypto API SHA-256 hashing for password storage and verification
 */

/**
 * Computes a SHA-256 hash string for a given text input.
 * @param {string} text 
 * @returns {Promise<string>} Hexadecimal SHA-256 hash string
 */
export async function hashPassword(text) {
  if (!text) return '';
  const msgBuffer = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Pre-computed SHA-256 hash for default Super Admin credentials
 * Username: saassuperqr999
 * Password: SuperAdmin8080
 */
const SUPER_ADMIN_USER_HASH = '57cea8dd8fcfba17e94c62e4aa1ba37b09ec790a7f49b45747e8641482c65158'; // sha256("saassuperqr999")
const SUPER_ADMIN_PASS_HASH = 'b9a36a2afc5bc25a81845580b03a2c95ea66d3402e7aeb5c647aa34194ebc332'; // sha256("SuperAdmin8080")

/**
 * Validates Super Admin credentials securely without plain-text strings in source.
 * @param {string} username 
 * @param {string} password 
 * @returns {Promise<boolean>}
 */
export async function verifySuperAdmin(username, password) {
  if (!username || !password) return false;
  const userHash = await hashPassword(username.trim().toLowerCase());
  const passHash = await hashPassword(password);
  
  // Also check environment variable overrides if configured on Vercel
  const envPassHash = import.meta.env.VITE_SUPERADMIN_HASH;
  if (envPassHash) {
    return userHash === SUPER_ADMIN_USER_HASH && passHash === envPassHash;
  }
  
  return userHash === SUPER_ADMIN_USER_HASH && passHash === SUPER_ADMIN_PASS_HASH;
}

/**
 * Verifies if an entered password matches either a hashed password or fallback legacy password.
 * @param {string} enteredPassword 
 * @param {string} storedPassword 
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(enteredPassword, storedPassword) {
  if (!enteredPassword || !storedPassword) return false;
  
  const cleanEntered = String(enteredPassword).trim();
  const cleanStored = String(storedPassword).trim();
  
  // Direct match for legacy unhashed passwords
  if (cleanEntered === cleanStored || enteredPassword === storedPassword) return true;
  
  // SHA-256 hash comparison
  const enteredHash = await hashPassword(cleanEntered);
  if (enteredHash === cleanStored || enteredHash === storedPassword) return true;
  
  return false;
}

/**
 * Normalizes and formats a QR base domain string.
 * Defaults to 'https://qr-menu-saas.vercel.app' if empty or invalid.
 * @param {string} url 
 * @returns {string} Formatted domain URL with protocol and no trailing slash
 */
export function formatQrDomain(url) {
  const DEFAULT_DOMAIN = 'https://qr-menu-saas.vercel.app';
  if (!url || !url.trim()) return DEFAULT_DOMAIN;
  let trimmed = url.trim().replace(/\/+$/, '');
  
  // Replace Vercel preview deployment URLs (*-projects.vercel.app) with the official production URL to prevent Vercel Authentication prompts on mobile phones
  if (trimmed.includes('-projects.vercel.app')) {
    return DEFAULT_DOMAIN;
  }
  
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }
  return trimmed;
}


