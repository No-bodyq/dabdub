import { Injectable, Logger } from "@nestjs/common";
import { RiskRuleType, RiskSeverity } from "../enums";
import { RiskCondition, RuleEvaluationResult } from "../interfaces";

export interface TransactionData {
  amount: number;
  currency: string;
  merchantId: string;
  fromAddress: string;
  fromCountry: string;
  timestamp: Date;
}

export interface MerchantData {
  id: string;
  totalVolume: number;
  recentTransactionCount: number;
  timeWindow: string;
}

@Injectable()
export class RuleEvaluationService {
  private readonly logger = new Logger(RuleEvaluationService.name);

  /**
   * Evaluates a transaction against a specific rule
   */
  evaluateTransactionAgainstRule(
    ruleType: RiskRuleType,
    conditions: RiskCondition,
    transactionData: TransactionData,
  ): boolean {
    try {
      switch (ruleType) {
        case RiskRuleType.TRANSACTION_AMOUNT:
          return this.evaluateTransactionAmount(conditions, transactionData);

        case RiskRuleType.ADDRESS_BLACKLIST:
          return this.evaluateAddressBlacklist(conditions, transactionData);

        case RiskRuleType.COUNTRY_BLOCK:
          return this.evaluateCountryBlock(conditions, transactionData);

        case RiskRuleType.TRANSACTION_VELOCITY:
          // Velocity rules require additional transaction history, handled separately
          return false;

        case RiskRuleType.MERCHANT_VOLUME:
          // Volume rules require merchant data, handled separately
          return false;

        default:
          return false;
      }
    } catch (error) {
      this.logger.error(
        `Error evaluating rule ${ruleType}: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }

  /**
   * Evaluates transaction velocity rule
   */
  evaluateTransactionVelocity(
    conditions: RiskCondition,
    transactionHistory: number[],
  ): boolean {
    const { transactionCount = 100, window = "1h" } = conditions;
    return transactionHistory.length >= transactionCount;
  }

  /**
   * Evaluates merchant volume rule
   */
  evaluateMerchantVolume(
    conditions: RiskCondition,
    merchantData: MerchantData,
  ): boolean {
    const { volumeThreshold = 1000000 } = conditions;
    return merchantData.totalVolume >= volumeThreshold;
  }

  /**
   * Evaluates transaction amount rule
   */
  private evaluateTransactionAmount(
    conditions: RiskCondition,
    transactionData: TransactionData,
  ): boolean {
    const {
      threshold = 50000,
      currency = "USD",
      comparison = "gt",
    } = conditions;

    if (transactionData.currency !== currency) {
      return false;
    }

    return this.compare(transactionData.amount, threshold, comparison);
  }

  /**
   * Evaluates address blacklist rule - case-insensitive matching
   */
  private evaluateAddressBlacklist(
    conditions: RiskCondition,
    transactionData: TransactionData,
  ): boolean {
    const { addresses = [] } = conditions;

    const normalizedFromAddress = transactionData.fromAddress.toLowerCase();
    return addresses.some(
      (addr) => addr.toLowerCase() === normalizedFromAddress,
    );
  }

  /**
   * Evaluates country block rule
   */
  private evaluateCountryBlock(
    conditions: RiskCondition,
    transactionData: TransactionData,
  ): boolean {
    const { countries = [] } = conditions;
    return countries.includes(transactionData.fromCountry);
  }

  /**
   * Comparison helper
   */
  private compare(
    value: number,
    threshold: number,
    comparison: string,
  ): boolean {
    switch (comparison) {
      case "gt":
        return value > threshold;
      case "gte":
        return value >= threshold;
      case "lt":
        return value < threshold;
      case "lte":
        return value <= threshold;
      case "eq":
        return value === threshold;
      default:
        return false;
    }
  }
}
