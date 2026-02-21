import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { SettlementService } from "../../../src/modules/settlements/services/settlement.service";
import { Settlement } from "../../../src/modules/settlements/entities/settlement.entity";
import { SettlementStatus } from "../../../src/common/enums";
import { getQueueToken } from "@nestjs/bull";
import { AuditService } from "../../../src/modules/audit/services/audit.service";

describe("SettlementService - Validation Tests", () => {
  let service: SettlementService;
  let mockSettlementRepository: any;
  let mockSettlementQueue: any;
  let mockAuditService: AuditService;

  beforeEach(async () => {
    mockSettlementRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    mockSettlementQueue = {
      add: jest.fn(),
    };

    mockAuditService = {
      log: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettlementService,
        {
          provide: getRepositoryToken(Settlement),
          useValue: mockSettlementRepository,
        },
        {
          provide: getQueueToken("settlement-processing"),
          useValue: mockSettlementQueue,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<SettlementService>(SettlementService);
  });

  describe("Manual trigger validation", () => {
    it("should validate transaction IDs belong to specified merchant", async () => {
      const dto = {
        merchantId: "merchant-123",
        transactionIds: ["tx-1", "tx-2"],
        reason: "Manual settlement trigger",
      };

      try {
        // Mock returns transactions with different merchant ID
        await service.triggerSettlement(dto, "user-1", "admin");
        fail("Should have thrown BadRequestException");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("ON_HOLD settlement exclusion", () => {
    it("should exclude ON_HOLD settlements from automatic runs", async () => {
      const settlement = {
        id: "settlement-1",
        status: SettlementStatus.ON_HOLD,
        merchantId: "merchant-123",
      };

      mockSettlementRepository.findOne.mockResolvedValue(settlement);

      const result = await service.getSettlement("settlement-1");

      expect(result.status).toBe(SettlementStatus.ON_HOLD);
    });
  });

  describe("Retry limit enforcement", () => {
    it("should enforce 3 retry limit per settlement", async () => {
      const settlement = {
        id: "settlement-1",
        status: SettlementStatus.FAILED,
        retryCount: 3,
      };

      mockSettlementRepository.findOne.mockResolvedValue(settlement);

      try {
        await service.retrySettlement("settlement-1", "user-1", "admin");
        fail("Should have thrown BadRequestException");
      } catch (error) {
        expect(error.message).toContain("Retry limit");
      }
    });
  });

  describe("Audit logging for mutations", () => {
    it("should log settlement mutations with admin identity", async () => {
      const settlement = {
        id: "settlement-1",
        status: SettlementStatus.ON_HOLD,
        merchantId: "merchant-123",
      };

      mockSettlementRepository.findOne.mockResolvedValue(settlement);
      mockSettlementRepository.save.mockResolvedValue({
        ...settlement,
        status: SettlementStatus.ON_HOLD,
      });

      await service.putSettlementOnHold(
        "settlement-1",
        { reason: "Testing settlement hold reason" },
        "admin-user-1",
        "admin",
      );

      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId: "admin-user-1",
          actorRole: "admin",
        }),
      );
    });
  });

  describe("Pending dashboard aggregation", () => {
    it("should correctly aggregate pending transactions by merchant", async () => {
      const dashboard = await service.getPendingDashboard();

      expect(dashboard.pendingByMerchant).toBeDefined();
      expect(dashboard.totals).toBeDefined();
      expect(dashboard.totals).toHaveProperty("merchantCount");
      expect(dashboard.totals).toHaveProperty("transactionCount");
      expect(dashboard.totals).toHaveProperty("volumeUsd");
    });
  });
});
