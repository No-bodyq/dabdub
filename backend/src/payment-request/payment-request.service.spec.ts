import { Test, TestingModule } from '@nestjs/testing';
import { PaymentRequestService } from './payment-request.service';
import { PaymentRequestRepository } from './repositories/payment-request.repository';
import { QrCodeService } from './services/qr-code.service';
import { StellarContractService } from './services/stellar-contract.service';
import { GlobalConfigService } from '../config/global-config.service';
import {
  PaymentRequestStatus,
  PaymentRequest,
} from '../database/entities/payment-request.entity';
import {
  PaymentRequestNotFoundException,
  PaymentRequestInvalidStatusException,
  PaymentRequestAmountTooLowException,
  PaymentRequestAmountTooHighException,
  PaymentRequestCannotCancelException,
} from './exceptions/payment-request.exceptions';

const mockStellarConfig = {
  activeNetwork: 'testnet',
  networks: {},
  defaultExpirationMinutes: 30,
  minPaymentAmount: 0.1,
  maxPaymentAmount: 10000,
};

const mockRepository = {
  create: jest.fn(),
  findById: jest.fn(),
  findByIdempotencyKey: jest.fn(),
  update: jest.fn(),
  search: jest.fn(),
  getStats: jest.fn(),
  getStatsInRange: jest.fn(),
  findExpired: jest.fn(),
  updateBatchStatus: jest.fn(),
};

const mockQrCodeService = {
  generateQrCode: jest.fn(),
  buildSep0007Uri: jest.fn(),
};

const mockStellarContractService = {
  createOnChainRequest: jest.fn(),
  getWalletAddress: jest.fn().mockReturnValue('GPLACEHOLDERADDRESS'),
};

const mockConfigService = {
  getStellarConfig: jest.fn().mockReturnValue(mockStellarConfig),
};

describe('PaymentRequestService', () => {
  let service: PaymentRequestService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentRequestService,
        { provide: PaymentRequestRepository, useValue: mockRepository },
        { provide: QrCodeService, useValue: mockQrCodeService },
        {
          provide: StellarContractService,
          useValue: mockStellarContractService,
        },
        { provide: GlobalConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<PaymentRequestService>(PaymentRequestService);

    jest.clearAllMocks();
    mockConfigService.getStellarConfig.mockReturnValue(mockStellarConfig);
  });

  describe('create', () => {
    it('should create a payment request successfully', async () => {
      const dto = {
        merchantId: 'merchant-uuid',
        amount: 10.5,
        currency: 'USDC',
      };

      const created = {
        id: 'new-id',
        ...dto,
        status: PaymentRequestStatus.PENDING,
        statusHistory: [{ status: 'pending', timestamp: expect.any(String) }],
      } as any;

      mockRepository.create.mockResolvedValue(created);

      const result = await service.create(dto);

      expect(result).toEqual(created);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          merchantId: 'merchant-uuid',
          amount: 10.5,
          currency: 'USDC',
          status: PaymentRequestStatus.PENDING,
        }),
      );
    });

    it('should return existing record for duplicate idempotency key', async () => {
      const existing = {
        id: 'existing-id',
        idempotencyKey: 'key-1',
        status: PaymentRequestStatus.PENDING,
      } as any;

      mockRepository.findByIdempotencyKey.mockResolvedValue(existing);

      const result = await service.create({
        merchantId: 'merchant-uuid',
        amount: 10,
        currency: 'USDC',
        idempotencyKey: 'key-1',
      });

      expect(result).toEqual(existing);
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should throw when amount is below minimum', async () => {
      await expect(
        service.create({
          merchantId: 'merchant-uuid',
          amount: 0.01,
          currency: 'USDC',
        }),
      ).rejects.toThrow(PaymentRequestAmountTooLowException);
    });

    it('should throw when amount exceeds maximum', async () => {
      await expect(
        service.create({
          merchantId: 'merchant-uuid',
          amount: 50000,
          currency: 'USDC',
        }),
      ).rejects.toThrow(PaymentRequestAmountTooHighException);
    });
  });

  describe('findById', () => {
    it('should return a payment request when found', async () => {
      const pr = { id: 'test-id', status: PaymentRequestStatus.PENDING } as any;
      mockRepository.findById.mockResolvedValue(pr);

      const result = await service.findById('test-id');
      expect(result).toEqual(pr);
    });

    it('should throw when not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(
        PaymentRequestNotFoundException,
      );
    });
  });

  describe('cancel', () => {
    it('should cancel a pending payment request', async () => {
      const pr = {
        id: 'test-id',
        status: PaymentRequestStatus.PENDING,
        statusHistory: [],
      } as any;
      mockRepository.findById.mockResolvedValue(pr);
      mockRepository.update.mockResolvedValue({
        ...pr,
        status: PaymentRequestStatus.CANCELLED,
      });

      const result = await service.cancel('test-id', 'test reason');

      expect(result.status).toBe(PaymentRequestStatus.CANCELLED);
      expect(mockRepository.update).toHaveBeenCalledWith(
        'test-id',
        expect.objectContaining({
          status: PaymentRequestStatus.CANCELLED,
        }),
      );
    });

    it('should throw when cancelling a completed request', async () => {
      const pr = {
        id: 'test-id',
        status: PaymentRequestStatus.COMPLETED,
        statusHistory: [],
      } as any;
      mockRepository.findById.mockResolvedValue(pr);

      await expect(service.cancel('test-id')).rejects.toThrow(
        PaymentRequestCannotCancelException,
      );
    });
  });

  describe('status transitions', () => {
    it('should allow PENDING -> PROCESSING transition', async () => {
      const pr = {
        id: 'test-id',
        status: PaymentRequestStatus.PENDING,
        statusHistory: [],
      } as any;
      mockRepository.findById.mockResolvedValue(pr);
      mockRepository.update.mockResolvedValue({
        ...pr,
        status: PaymentRequestStatus.PROCESSING,
      });

      const result = await service.process('test-id');
      expect(result.status).toBe(PaymentRequestStatus.PROCESSING);
    });

    it('should reject invalid status transitions', async () => {
      const pr = {
        id: 'test-id',
        status: PaymentRequestStatus.EXPIRED,
        statusHistory: [],
      } as any;
      mockRepository.findById.mockResolvedValue(pr);

      await expect(service.process('test-id')).rejects.toThrow(
        PaymentRequestInvalidStatusException,
      );
    });

    it('should allow COMPLETED -> REFUNDED transition', async () => {
      const pr = {
        id: 'test-id',
        status: PaymentRequestStatus.COMPLETED,
        statusHistory: [],
      } as any;
      mockRepository.findById.mockResolvedValue(pr);
      mockRepository.update.mockResolvedValue({
        ...pr,
        status: PaymentRequestStatus.REFUNDED,
      });

      const result = await service.refund('test-id', 'customer requested');
      expect(result.status).toBe(PaymentRequestStatus.REFUNDED);
    });
  });

  describe('search', () => {
    it('should return paginated results', async () => {
      const requests = [
        { id: '1', status: PaymentRequestStatus.PENDING },
        { id: '2', status: PaymentRequestStatus.COMPLETED },
      ] as any;
      mockRepository.search.mockResolvedValue([requests, 2]);

      const result = await service.search({ page: '1', limit: '10' });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });
  });

  describe('getStats', () => {
    it('should return statistics', async () => {
      const stats = {
        total: 10,
        pending: 3,
        completed: 5,
        failed: 2,
        totalAmount: 1000,
      };
      mockRepository.getStats.mockResolvedValue(stats);

      const result = await service.getStats('merchant-uuid');

      expect(result).toEqual(stats);
      expect(mockRepository.getStats).toHaveBeenCalledWith('merchant-uuid');
    });
  });

  describe('update', () => {
    it('should update a pending payment request', async () => {
      const pr = {
        id: 'test-id',
        status: PaymentRequestStatus.PENDING,
        amount: 10,
      } as any;
      mockRepository.findById.mockResolvedValue(pr);
      mockRepository.update.mockResolvedValue({ ...pr, amount: 20 });

      const result = await service.update('test-id', { amount: 20 });
      expect(result.amount).toBe(20);
    });

    it('should throw when updating non-pending request', async () => {
      const pr = {
        id: 'test-id',
        status: PaymentRequestStatus.COMPLETED,
      } as any;
      mockRepository.findById.mockResolvedValue(pr);

      await expect(service.update('test-id', { amount: 20 })).rejects.toThrow(
        PaymentRequestInvalidStatusException,
      );
    });
  });

  describe('getQrCode', () => {
    it('should return cached QR code if available', async () => {
      const pr = {
        id: 'test-id',
        amount: 10,
        stellarNetwork: 'testnet',
        qrCodeData: 'cached-base64',
      } as any;
      mockRepository.findById.mockResolvedValue(pr);
      mockQrCodeService.buildSep0007Uri.mockReturnValue('web+stellar:pay?...');

      const result = await service.getQrCode('test-id');

      expect(result.qrCode).toBe('cached-base64');
      expect(mockQrCodeService.generateQrCode).not.toHaveBeenCalled();
    });

    it('should generate and cache QR code if not cached', async () => {
      const pr = {
        id: 'test-id',
        amount: 10,
        stellarNetwork: 'testnet',
        qrCodeData: null,
      } as any;
      mockRepository.findById.mockResolvedValue(pr);
      mockQrCodeService.buildSep0007Uri.mockReturnValue('web+stellar:pay?...');
      mockQrCodeService.generateQrCode.mockResolvedValue('new-base64');
      mockRepository.update.mockResolvedValue(pr);

      const result = await service.getQrCode('test-id');

      expect(result.qrCode).toBe('new-base64');
      expect(mockQrCodeService.generateQrCode).toHaveBeenCalled();
      expect(mockRepository.update).toHaveBeenCalledWith('test-id', {
        qrCodeData: 'new-base64',
      });
    });
  });
});
