import { Test, TestingModule } from '@nestjs/testing';
import {
  RuleEvaluationService,
  TransactionData,
} from '../services/rule-evaluation.service';
import { RiskRuleType } from '../enums';

describe('RuleEvaluationService', () => {
  let service: RuleEvaluationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RuleEvaluationService],
    }).compile();

    service = module.get<RuleEvaluationService>(RuleEvaluationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('TRANSACTION_AMOUNT evaluation', () => {
    const transactionData: TransactionData = {
      amount: 75000,
      currency: 'USD',
      merchantId: 'merchant-123',
      fromAddress: '0x123abc',
      fromCountry: 'US',
      timestamp: new Date(),
    };

    it('should trigger when amount exceeds threshold', () => {
      const conditions = {
        threshold: 50000,
        currency: 'USD',
        comparison: 'gt' as const,
      };

      const result = service.evaluateTransactionAgainstRule(
        RiskRuleType.TRANSACTION_AMOUNT,
        conditions,
        transactionData,
      );

      expect(result).toBe(true);
    });

    it('should not trigger when amount is below threshold', () => {
      const conditions = {
        threshold: 100000,
        currency: 'USD',
        comparison: 'gt' as const,
      };

      const result = service.evaluateTransactionAgainstRule(
        RiskRuleType.TRANSACTION_AMOUNT,
        conditions,
        transactionData,
      );

      expect(result).toBe(false);
    });

    it('should support different comparison operators', () => {
      // Test gte
      let conditions = {
        threshold: 75000,
        currency: 'USD',
        comparison: 'gte' as const,
      };
      expect(
        service.evaluateTransactionAgainstRule(
          RiskRuleType.TRANSACTION_AMOUNT,
          conditions,
          transactionData,
        ),
      ).toBe(true);

      // Test lte
      conditions = {
        threshold: 75000,
        currency: 'USD',
        comparison: 'lte' as const,
      };
      expect(
        service.evaluateTransactionAgainstRule(
          RiskRuleType.TRANSACTION_AMOUNT,
          conditions,
          transactionData,
        ),
      ).toBe(true);

      // Test eq
      conditions = {
        threshold: 75000,
        currency: 'USD',
        comparison: 'eq' as const,
      };
      expect(
        service.evaluateTransactionAgainstRule(
          RiskRuleType.TRANSACTION_AMOUNT,
          conditions,
          transactionData,
        ),
      ).toBe(true);
    });

    it('should return false when currency does not match', () => {
      const conditions = {
        threshold: 50000,
        currency: 'EUR',
        comparison: 'gt' as const,
      };

      const result = service.evaluateTransactionAgainstRule(
        RiskRuleType.TRANSACTION_AMOUNT,
        conditions,
        transactionData,
      );

      expect(result).toBe(false);
    });
  });

  describe('ADDRESS_BLACKLIST evaluation', () => {
    const transactionData: TransactionData = {
      amount: 1000,
      currency: 'USD',
      merchantId: 'merchant-123',
      fromAddress: '0x123ABC',
      fromCountry: 'US',
      timestamp: new Date(),
    };

    it('should trigger when address is in blacklist', () => {
      const conditions = {
        addresses: ['0x123abc', '0x456def', '0x789ghi'],
      };

      const result = service.evaluateTransactionAgainstRule(
        RiskRuleType.ADDRESS_BLACKLIST,
        conditions,
        transactionData,
      );

      expect(result).toBe(true);
    });

    it('should be case-insensitive when matching addresses', () => {
      const conditions = {
        addresses: ['0x123abc'],
      };

      const result = service.evaluateTransactionAgainstRule(
        RiskRuleType.ADDRESS_BLACKLIST,
        conditions,
        transactionData,
      );

      expect(result).toBe(true);
    });

    it('should not trigger when address is not in blacklist', () => {
      const conditions = {
        addresses: ['0x999xxx', '0x888yyy'],
      };

      const result = service.evaluateTransactionAgainstRule(
        RiskRuleType.ADDRESS_BLACKLIST,
        conditions,
        transactionData,
      );

      expect(result).toBe(false);
    });

    it('should handle mixed case addresses correctly', () => {
      const mixedCaseData: TransactionData = {
        ...transactionData,
        fromAddress: 'AbCdEf123',
      };

      const conditions = {
        addresses: ['abcdef123', 'ABCDEF123', 'AbCdEf123'],
      };

      const result = service.evaluateTransactionAgainstRule(
        RiskRuleType.ADDRESS_BLACKLIST,
        conditions,
        mixedCaseData,
      );

      expect(result).toBe(true);
    });
  });

  describe('COUNTRY_BLOCK evaluation', () => {
    const transactionData: TransactionData = {
      amount: 1000,
      currency: 'USD',
      merchantId: 'merchant-123',
      fromAddress: '0x123abc',
      fromCountry: 'KP',
      timestamp: new Date(),
    };

    it('should trigger when country is in blocked list', () => {
      const conditions = {
        countries: ['KP', 'IR', 'SY'],
      };

      const result = service.evaluateTransactionAgainstRule(
        RiskRuleType.COUNTRY_BLOCK,
        conditions,
        transactionData,
      );

      expect(result).toBe(true);
    });

    it('should not trigger when country is not in blocked list', () => {
      const conditions = {
        countries: ['US', 'CA', 'UK'],
      };

      const result = service.evaluateTransactionAgainstRule(
        RiskRuleType.COUNTRY_BLOCK,
        conditions,
        transactionData,
      );

      expect(result).toBe(false);
    });
  });

  describe('TRANSACTION_VELOCITY evaluation', () => {
    it('should trigger when transaction count exceeds threshold', () => {
      const conditions = {
        transactionCount: 100,
        window: '1h',
      };

      const transactionHistory = Array(110).fill(1); // 110 transactions
      const result = service.evaluateTransactionVelocity(
        conditions,
        transactionHistory,
      );

      expect(result).toBe(true);
    });

    it('should not trigger when transaction count is below threshold', () => {
      const conditions = {
        transactionCount: 100,
        window: '1h',
      };

      const transactionHistory = Array(50).fill(1); // 50 transactions
      const result = service.evaluateTransactionVelocity(
        conditions,
        transactionHistory,
      );

      expect(result).toBe(false);
    });

    it('should trigger at exactly the threshold', () => {
      const conditions = {
        transactionCount: 100,
        window: '1h',
      };

      const transactionHistory = Array(100).fill(1); // 100 transactions
      const result = service.evaluateTransactionVelocity(
        conditions,
        transactionHistory,
      );

      expect(result).toBe(true);
    });
  });

  describe('MERCHANT_VOLUME evaluation', () => {
    it('should trigger when merchant volume exceeds threshold', () => {
      const conditions = {
        volumeThreshold: 1000000,
        timeWindow: '24h',
      };

      const merchantData = {
        id: 'merchant-123',
        totalVolume: 1500000,
        recentTransactionCount: 50,
        timeWindow: '24h',
      };

      const result = service.evaluateMerchantVolume(conditions, merchantData);
      expect(result).toBe(true);
    });

    it('should not trigger when merchant volume is below threshold', () => {
      const conditions = {
        volumeThreshold: 1000000,
        timeWindow: '24h',
      };

      const merchantData = {
        id: 'merchant-123',
        totalVolume: 500000,
        recentTransactionCount: 30,
        timeWindow: '24h',
      };

      const result = service.evaluateMerchantVolume(conditions, merchantData);
      expect(result).toBe(false);
    });
  });

  describe('Error handling', () => {
    it('should handle invalid rule types gracefully', () => {
      const transactionData: TransactionData = {
        amount: 1000,
        currency: 'USD',
        merchantId: 'merchant-123',
        fromAddress: '0x123abc',
        fromCountry: 'US',
        timestamp: new Date(),
      };

      // This should not throw but return false
      const result = service.evaluateTransactionAgainstRule(
        'INVALID_TYPE' as RiskRuleType,
        {},
        transactionData,
      );

      expect(result).toBe(false);
    });
  });
});
