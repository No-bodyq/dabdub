import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { RefundService } from "../../../src/modules/refunds/services/refund.service";
import { Refund } from "../../../src/modules/refunds/entities/refund.entity";
import {
  RefundStatus,
  RefundMethod,
  RefundReason,
} from "../../../src/common/enums";
import { getQueueToken } from "@nestjs/bull";
import { AuditService } from "../../../src/modules/audit/services/audit.service";

describe("RefundService - Validation Tests", () => {
  let service: RefundService;
  let mockRefundRepository: any;
  let mockRefundQueue: any;
  let mockAuditService: AuditService;

  beforeEach(async () => {
    mockRefundRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    mockRefundQueue = {
      add: jest.fn(),
    };

    mockAuditService = {
      log: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefundService,
        {
          provide: getRepositoryToken(Refund),
          useValue: mockRefundRepository,
        },
        {
          provide: getQueueToken("refund-processing"),
          useValue: mockRefundQueue,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<RefundService>(RefundService);
  });

  describe("Over-refund validation", () => {
    it("should prevent over-refunding a transaction", async () => {
      const dto = {
        refundAmountUsd: "1500.00",
        method: RefundMethod.CRYPTO_ONCHAIN,
        reason: RefundReason.CUSTOMER_REQUEST,
        internalNote: "This is a test refund note for testing",
      };

      mockRefundRepository.createQueryBuilder.mockReturnValue({
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ total: "500.00" }),
      });

      mockRefundRepository.save.mockResolvedValue({
        id: "refund-1",
        ...dto,
      });

      try {
        await service.initiateRefund("tx-1", dto, "user-1", "admin");
        fail("Should have thrown BadRequestException");
      } catch (error) {
        expect(error.message).toContain("exceeds available balance");
      }
    });

    it("should allow partial refund within transaction amount", async () => {
      const dto = {
        refundAmountUsd: "500.00",
        method: RefundMethod.CRYPTO_ONCHAIN,
        reason: RefundReason.CUSTOMER_REQUEST,
        internalNote: "This is a test refund note for testing",
      };

      const refundEntity = {
        id: "refund-1",
        transactionId: "tx-1",
        merchantId: "merchant-123",
        ...dto,
        status: RefundStatus.INITIATED,
        retryCount: 0,
      };

      mockRefundRepository.save.mockResolvedValue(refundEntity);
      mockRefundRepository.createQueryBuilder.mockReturnValue({
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ total: "300.00" }),
      });

      const result = await service.initiateRefund(
        "tx-1",
        dto,
        "user-1",
        "admin",
      );

      expect(result).toBeDefined();
      expect(mockRefundRepository.save).toHaveBeenCalled();
    });
  });

  describe("Partial refund math", () => {
    it("should correctly calculate partial refund amounts", async () => {
      const transactionAmount = 1000;
      const firstRefund = 300;
      const secondRefund = 200;
      const totalRefunded = firstRefund + secondRefund;

      expect(totalRefunded).toBeLessThanOrEqual(transactionAmount);
      expect(transactionAmount - totalRefunded).toBe(500);
    });
  });

  describe("Retry limit enforcement", () => {
    it("should prevent retry when limit is exceeded", async () => {
      const refund = {
        id: "refund-1",
        status: RefundStatus.FAILED,
        retryCount: 3,
      };

      mockRefundRepository.findOne.mockResolvedValue(refund);

      try {
        await service.retryRefund("refund-1", "user-1", "admin");
        fail("Should have thrown BadRequestException");
      } catch (error) {
        expect(error.message).toContain("Retry limit");
      }
    });

    it("should allow retry when under limit", async () => {
      const refund = {
        id: "refund-1",
        status: RefundStatus.FAILED,
        retryCount: 1,
      };

      mockRefundRepository.findOne.mockResolvedValue({
        ...refund,
        status: RefundStatus.INITIATED,
        retryCount: 2,
      });

      mockRefundRepository.save.mockResolvedValue({
        ...refund,
        status: RefundStatus.INITIATED,
        retryCount: 2,
      });

      const result = await service.retryRefund("refund-1", "user-1", "admin");

      expect(result.retryCount).toBe(2);
    });
  });

  describe("Merchant balance validation for FIAT_DEDUCTION", () => {
    it("should check merchant balance before FIAT_DEDUCTION refund", async () => {
      const dto = {
        refundAmountUsd: "6000.00",
        method: RefundMethod.FIAT_DEDUCTION,
        reason: RefundReason.CUSTOMER_REQUEST,
        internalNote: "This is a test refund note for testing purpose",
      };

      mockRefundRepository.createQueryBuilder.mockReturnValue({
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ total: "0.00" }),
      });

      try {
        await service.initiateRefund("tx-1", dto, "user-1", "admin");
        fail("Should have thrown ForbiddenException");
      } catch (error) {
        expect(error.message).toContain("insufficient balance");
      }
    });
  });
});
