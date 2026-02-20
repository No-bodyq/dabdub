/**
 * Field names to redact when logging request/response bodies.
 * Keys are matched case-insensitively.
 */
export const SENSITIVE_LOG_FIELDS = [
  'password',
  'token',
  'secret',
  'authorization',
  'apikey',
  'apiKey',
  'api_key',
  'refreshtoken',
  'refreshToken',
  'refresh_token',
  'totpcode',
  'totpCode',
  'totp_code',
] as const;

const SENSITIVE_SET = new Set(
  SENSITIVE_LOG_FIELDS.map((f) => f.toLowerCase()),
);

const REDACTED = '[REDACTED]';

/**
 * Recursively sanitizes an object for safe logging by replacing sensitive
 * field values with [REDACTED].
 */
export function sanitizeForLog(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeForLog);
  }

  if (typeof value === 'object' && value !== null) {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      const keyLower = key.toLowerCase();
      if (SENSITIVE_SET.has(keyLower)) {
        out[key] = REDACTED;
      } else {
        out[key] = sanitizeForLog(val);
      }
    }
    return out;
  }

  return value;
}
