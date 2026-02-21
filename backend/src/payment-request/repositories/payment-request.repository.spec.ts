import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PaymentRequestRepository } from './payment-request.repository';
import {
  PaymentRequest,
  PaymentRequestStatus,
} from '../../database/entities/payment-request.entity';

const mockQueryBuilder = {
  andWhere: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn(),
  getCount: jest.fn(),
  getMany: jest.fn(),
  select: jest.fn().mockReturnThis(),
  getRawOne: jest.fn(),
  clone: jest.fn(),
};

// Make clone return the same mock for chaining
mockQueryBuilder.clone.mockReturnValue(mockQueryBuilder);

const mockTypeOrmRepo = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  find: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
};

describe('PaymentRequestRepository', () => {
  let repository: PaymentRequestRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentRequestRepository,
        {
          provide: getRepositoryToken(PaymentRequest),
          useValue: mockTypeOrmRepo,
        },
      ],
    }).compile();

    repository = module.get<PaymentRequestRepository>(PaymentRequestRepository);

    jest.clearAllMocks();
    mockQueryBuilder.clone.mockReturnValue(mockQueryBuilder);
  });

  describe('findExpired', () => {
    it('should find pending requests past expiration', async () => {
      const now = new Date();
      const expired = [
        {
          id: '1',
          status: PaymentRequestStatus.PENDING,
          expiresAt: new Date(Date.now() - 60000),
        },
      ];
      mockTypeOrmRepo.find.mockResolvedValue(expired);

      const result = await repository.findExpired(now);

      expect(result).toEqual(expired);
      expect(mockTypeOrmRepo.find).toHaveBeenCalledWith({
        where: {
          status: PaymentRequestStatus.PENDING,
          expiresAt: expect.anything(),
        },
      });
    });
  });

  describe('search', () => {
    it('should return paginated results with filters', async () => {
      const requests = [{ id: '1' }, { id: '2' }];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([requests, 2]);

      const result = await repository.search({
        merchantId: 'merchant-1',
        status: PaymentRequestStatus.PENDING,
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      });

      expect(result).toEqual([requests, 2]);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'pr.merchantId = :merchantId',
        { merchantId: 'merchant-1' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'pr.status = :status',
        { status: PaymentRequestStatus.PENDING },
      );
    });
  });

  describe('updateBatchStatus', () => {
    it('should update multiple records', async () => {
      const ids = ['1', '2', '3'];
      mockTypeOrmRepo.update.mockResolvedValue({ affected: 3 });

      await repository.updateBatchStatus(ids, PaymentRequestStatus.EXPIRED);

      expect(mockTypeOrmRepo.update).toHaveBeenCalledWith(ids, {
        status: PaymentRequestStatus.EXPIRED,
      });
    });

    it('should skip when ids array is empty', async () => {
      await repository.updateBatchStatus([], PaymentRequestStatus.EXPIRED);
      expect(mockTypeOrmRepo.update).not.toHaveBeenCalled();
    });
  });

  describe('findByIdempotencyKey', () => {
    it('should find by idempotency key', async () => {
      const pr = { id: '1', idempotencyKey: 'key-1' };
      mockTypeOrmRepo.findOne.mockResolvedValue(pr);

      const result = await repository.findByIdempotencyKey('key-1');

      expect(result).toEqual(pr);
      expect(mockTypeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { idempotencyKey: 'key-1' },
      });
    });

    it('should return null when not found', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(null);

      const result = await repository.findByIdempotencyKey('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('getStats', () => {
    it('should return stats for a merchant', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(10);
      mockQueryBuilder.getRawOne.mockResolvedValue({ total: '1000.00' });

      const result = await repository.getStats('merchant-1');

      expect(result).toBeDefined();
      expect(result.total).toBe(10);
    });
  });

  describe('create', () => {
    it('should create and save a payment request', async () => {
      const data = {
        merchantId: 'merchant-1',
        amount: 10,
        currency: 'USDC',
      };
      const entity = { ...data, id: 'new-id' };
      mockTypeOrmRepo.create.mockReturnValue(entity);
      mockTypeOrmRepo.save.mockResolvedValue(entity);

      const result = await repository.create(data);

      expect(result).toEqual(entity);
      expect(mockTypeOrmRepo.create).toHaveBeenCalledWith(data);
      expect(mockTypeOrmRepo.save).toHaveBeenCalledWith(entity);
    });
  });

  describe('findById', () => {
    it('should find by id', async () => {
      const pr = { id: 'test-id' };
      mockTypeOrmRepo.findOne.mockResolvedValue(pr);

      const result = await repository.findById('test-id');
      expect(result).toEqual(pr);
    });

    it('should return null when not found', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(null);

      const result = await repository.findById('nonexistent');
      expect(result).toBeNull();
    });
  });
});
