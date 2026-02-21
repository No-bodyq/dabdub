export const SENSITIVE_FIELDS = [
  'password',
  'passwordConfirm',
  'token',
  'accessToken',
  'refreshToken',
  'authorization',
  'cookie',
  'secret',
  'creditCard',
  'credit_card',
  'cvv',
];

export function maskSensitiveData(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => maskSensitiveData(item));
  }

  const masked = { ...data };

  for (const key in masked) {
    if (Object.prototype.hasOwnProperty.call(masked, key)) {
      if (SENSITIVE_FIELDS.includes(key.toLowerCase())) {
        masked[key] = '********';
      } else if (typeof masked[key] === 'object') {
        masked[key] = maskSensitiveData(masked[key]);
      }
    }
  }

  return masked;
}
