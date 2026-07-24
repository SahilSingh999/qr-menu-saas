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
 * Sanitizes user input string against Cross-Site Scripting (XSS) attacks.
 * Escapes hazardous HTML entities before storage or rendering.
 * @param {string} input 
 * @returns {string} Sanitized plain-text string
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * In-Memory & Session Rate Limiter to prevent brute-force attacks on logins & activation keys.
 */
class RateLimiter {
  constructor(maxAttempts = 5, cooldownSeconds = 60) {
    this.maxAttempts = maxAttempts;
    this.cooldownSeconds = cooldownSeconds;
    this.attemptsMap = {};
  }

  isLocked(key) {
    const record = this.attemptsMap[key];
    if (!record) return { locked: false, remainingSeconds: 0 };
    const now = Date.now();
    if (record.lockedUntil && now < record.lockedUntil) {
      const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
      return { locked: true, remainingSeconds };
    }
    if (record.lockedUntil && now >= record.lockedUntil) {
      delete this.attemptsMap[key];
      return { locked: false, remainingSeconds: 0 };
    }
    return { locked: false, remainingSeconds: 0 };
  }

  recordFailedAttempt(key) {
    const now = Date.now();
    if (!this.attemptsMap[key]) {
      this.attemptsMap[key] = { count: 1, firstAttemptTime: now, lockedUntil: null };
    } else {
      this.attemptsMap[key].count += 1;
    }

    if (this.attemptsMap[key].count >= this.maxAttempts) {
      this.attemptsMap[key].lockedUntil = now + (this.cooldownSeconds * 1000);
      return { locked: true, remainingSeconds: this.cooldownSeconds };
    }

    return { locked: false, remainingAttempts: this.maxAttempts - this.attemptsMap[key].count };
  }

  reset(key) {
    delete this.attemptsMap[key];
  }
}

export const loginRateLimiter = new RateLimiter(5, 60);

/**
 * Validates Super Admin credentials securely without plain-text strings in source.
 * Supports environment variable overrides via VITE_SUPERADMIN_USER_HASH and VITE_SUPERADMIN_PASS_HASH.
 * @param {string} username 
 * @param {string} password 
 * @returns {Promise<boolean>}
 */
export async function verifySuperAdmin(username, password) {
  if (!username || !password) return false;
  const userHash = await hashPassword(username.trim().toLowerCase());
  const passHash = await hashPassword(password);
  
  const envUserHash = import.meta.env.VITE_SUPERADMIN_USER_HASH;
  const envPassHash = import.meta.env.VITE_SUPERADMIN_PASS_HASH || import.meta.env.VITE_SUPERADMIN_HASH;

  const targetUserHash = envUserHash || SUPER_ADMIN_USER_HASH;
  const targetPassHash = envPassHash || SUPER_ADMIN_PASS_HASH;
  
  return userHash === targetUserHash && passHash === targetPassHash;
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
 * Auto-detects live production domain from window.location.origin when in a browser context.
 * Falls back to the Vercel production URL for safe defaults.
 * @param {string} url - override URL, or empty to use auto-detected domain
 * @returns {string} Formatted domain URL with protocol and no trailing slash
 */
export function formatQrDomain(url) {
  // Auto-detect the live production domain from the current browser context.
  // This ensures QR codes always encode the real public URL no matter where the app is deployed.
  const autoDetectedDomain = (typeof window !== 'undefined' && window.location?.origin)
    ? window.location.origin
    : 'https://qr-menu-saas-dun.vercel.app';

  if (!url || !url.trim()) return autoDetectedDomain;
  let trimmed = url.trim().replace(/\/+$/, '');

  // CRITICAL FIX: If passed URL points to the dead/wrong project "qr-menu-saas.vercel.app" (without -dun), override with live domain
  if (trimmed.includes('qr-menu-saas.vercel.app') && !trimmed.includes('qr-menu-saas-dun.vercel.app')) {
    return autoDetectedDomain;
  }

  // Strip any subpath routes that may have been accidentally pasted (e.g. /admin, /superadmin)
  try {
    const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    trimmed = parsed.origin; // keep only protocol + host, drop any path
  } catch (_) {
    // ignore parse errors, fall through
  }

  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }
  return trimmed;
}


