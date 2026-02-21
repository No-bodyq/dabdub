import { RiskRuleType } from "../enums";

export interface RiskCondition {
  // For TRANSACTION_AMOUNT
  threshold?: number;
  currency?: string;
  comparison?: "gt" | "gte" | "lt" | "lte" | "eq";

  // For TRANSACTION_VELOCITY
  transactionCount?: number;
  window?: string; // e.g., '1h', '24h', '7d'

  // For MERCHANT_VOLUME
  volumeThreshold?: number;
  timeWindow?: string;

  // For ADDRESS_BLACKLIST
  addresses?: string[];

  // For COUNTRY_BLOCK
  countries?: string[];
}
