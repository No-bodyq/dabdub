import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

export class WebhookSigner {
  /**
   * Generates a new webhook secret
   */
  static generateSecret(): string {
    return 'whsec_' + randomBytes(32).toString('hex');
  }

  /**
   * Signs a payload with a secret
   */
  static signPayload(
    secret: string,
    payload: string | Buffer,
    timestamp: number,
  ): string {
    const signaturePayload = `${timestamp}.${payload.toString()}`;
    return createHmac('sha256', secret).update(signaturePayload).digest('hex');
  }

  /**
   * Validates a webhook signature
   */
  static validateSignature(
    secret: string,
    payload: string | Buffer,
    signature: string,
    timestamp: number,
    toleranceSeconds = 300,
  ): boolean {
    // Check timestamp tolerance to prevent replay attacks
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > toleranceSeconds) {
      return false;
    }

    const expectedSignature = this.signPayload(secret, payload, timestamp);

    try {
      return timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex'),
      );
    } catch {
      return false;
    }
  }
}
