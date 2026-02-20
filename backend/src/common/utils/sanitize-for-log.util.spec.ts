import { sanitizeForLog, SENSITIVE_LOG_FIELDS } from './sanitize-for-log.util';

describe('sanitizeForLog', () => {
  it('returns null and undefined unchanged', () => {
    expect(sanitizeForLog(null)).toBe(null);
    expect(sanitizeForLog(undefined)).toBe(undefined);
  });

  it('returns primitives unchanged', () => {
    expect(sanitizeForLog('hello')).toBe('hello');
    expect(sanitizeForLog(42)).toBe(42);
    expect(sanitizeForLog(true)).toBe(true);
  });

  it('redacts password (case-insensitive)', () => {
    expect(sanitizeForLog({ password: 'secret123' })).toEqual({
      password: '[REDACTED]',
    });
    expect(sanitizeForLog({ Password: 'secret123' })).toEqual({
      Password: '[REDACTED]',
    });
    expect(sanitizeForLog({ PASSWORD: 'secret123' })).toEqual({
      PASSWORD: '[REDACTED]',
    });
  });

  it('redacts all sensitive fields', () => {
    const input = {
      password: 'pwd',
      token: 't',
      secret: 's',
      authorization: 'Bearer x',
      apiKey: 'key',
      refreshToken: 'rt',
      totpCode: '123456',
      email: 'u@x.com',
    };
    const out = sanitizeForLog(input) as Record<string, unknown>;
    expect(out.password).toBe('[REDACTED]');
    expect(out.token).toBe('[REDACTED]');
    expect(out.secret).toBe('[REDACTED]');
    expect(out.authorization).toBe('[REDACTED]');
    expect(out.apiKey).toBe('[REDACTED]');
    expect(out.refreshToken).toBe('[REDACTED]');
    expect(out.totpCode).toBe('[REDACTED]');
    expect(out.email).toBe('u@x.com');
  });

  it('redacts nested objects recursively', () => {
    const input = {
      user: {
        name: 'John',
        password: 'secret',
        credentials: {
          apiKey: 'key',
          publicId: 'id',
        },
      },
    };
    const out = sanitizeForLog(input) as Record<string, unknown>;
    expect((out.user as Record<string, unknown>).password).toBe('[REDACTED]');
    expect(
      ((out.user as Record<string, unknown>).credentials as Record<string, unknown>).apiKey,
    ).toBe('[REDACTED]');
    expect(
      ((out.user as Record<string, unknown>).credentials as Record<string, unknown>).publicId,
    ).toBe('id');
  });

  it('sanitizes arrays', () => {
    const input = [{ password: 'a' }, { token: 'b' }];
    const out = sanitizeForLog(input) as Array<Record<string, unknown>>;
    expect(out[0].password).toBe('[REDACTED]');
    expect(out[1].token).toBe('[REDACTED]');
  });

  it('exports SENSITIVE_LOG_FIELDS for reference', () => {
    expect(SENSITIVE_LOG_FIELDS).toContain('password');
    expect(SENSITIVE_LOG_FIELDS).toContain('refreshToken');
    expect(SENSITIVE_LOG_FIELDS).toContain('totpCode');
  });
});
