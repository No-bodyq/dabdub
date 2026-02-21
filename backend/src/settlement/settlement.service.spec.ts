import { Test, TestingModule } from '@nestjs/testing';
import { SettlementService } from './settlement.service';
import { SettlementRepository } from './repositories/settlement.repository';
import { SettlementStatus } from './entities/settlement.entity';

const mockSettlementRepository = {
  create: jest.fn(),
  update: jest.fn(),
  updateBatch: jest.fn(),
  updateStatus: jest.fn(),
  findPendingSettlements: jest.fn(),
};

const mockPartnerService = {
  getExchangeRate: jest.fn(),
  executeTransfer: jest.fn(),
};

describe('SettlementService', () => {
  let service: SettlementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettlementService,
        {
          provide: SettlementRepository,
          useValue: mockSettlementRepository,
        },
        {
          provide: 'IPartnerService',
          useValue: mockPartnerService,
        },
      ],
    }).compile();

    service = module.get<SettlementService>(SettlementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSettlement', () => {
    it('should create a settlement with calculated fees and exchange rate', async () => {
      mockPartnerService.getExchangeRate.mockResolvedValue(1.0);
      mockSettlementRepository.create.mockReturnValue({ id: 'test-id' });

      const result = await service.createSettlement({
        paymentRequestId: 'req-1',
        merchantId: 'merch-1',
        amount: 100,
        currency: 'USD',
        sourceCurrency: 'USDC',
        bankDetails: {
          accountNumber: '123',
          routingNumber: '456',
          name: 'John Doe',
          bankName: 'Test Bank',
        },
      });

      expect(mockPartnerService.getExchangeRate).toHaveBeenCalledWith(
        'USDC',
        'USD',
      );
      expect(mockSettlementRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 100,
          feeAmount: 1, // 1% of 100
          netAmount: 99,
          exchangeRate: 1.0,
        }),
      );
    });
  });

  describe('processSettlements', () => {
    it('should process pending settlements', async () => {
      const pendingSettlements = [
        {
          id: 's-1',
          amount: 100,
          netAmount: 99,
          currency: 'USD',
          bankAccountNumber: '123',
          bankRoutingNumber: '456',
          bankAccountHolderName: 'John',
          retryCount: 0,
          maxRetries: 3,
        },
      ];

      mockSettlementRepository.findPendingSettlements.mockResolvedValue(
        pendingSettlements,
      );
      mockPartnerService.executeTransfer.mockResolvedValue({
        success: true,
        transactionId: 'tx-1',
      });

      await service.processSettlements();

      // Check if batch update called
      expect(mockSettlementRepository.updateBatch).toHaveBeenCalledWith(
        ['s-1'],
        expect.anything(),
      );

      // Check if transfer executed
      expect(mockPartnerService.executeTransfer).toHaveBeenCalled();

      // Check if status updated to COMPLETED
      expect(mockSettlementRepository.updateStatus).toHaveBeenCalledWith(
        's-1',
        SettlementStatus.COMPLETED,
        expect.anything(),
      );
    });

    it('should handle transfer failure', async () => {
      const pendingSettlements = [
        {
          id: 's-2',
          amount: 100,
          netAmount: 99,
          currency: 'EUR',
          retryCount: 0,
          maxRetries: 3,
        },
      ];

      mockSettlementRepository.findPendingSettlements.mockResolvedValue(
        pendingSettlements,
      );
      mockPartnerService.executeTransfer.mockResolvedValue({
        success: false,
        error: 'Bank Error',
      });

      await service.processSettlements();

      // Check if retry logic invoked (update called with incremented retry count)
      expect(mockSettlementRepository.update).toHaveBeenCalledWith(
        's-2',
        expect.objectContaining({
          status: SettlementStatus.PENDING,
          retryCount: 1,
          failureReason: 'Bank Error',
        }),
      );
    });
  });
});
