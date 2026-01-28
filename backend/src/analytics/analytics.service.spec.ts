import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { Settlement } from '../settlement/entities/settlement.entity';
import { Merchant } from '../database/entities/merchant.entity';
import { PaymentRequest } from '../database/entities/payment-request.entity';

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  const mockRepository = {
    createQueryBuilder: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
    })),
    count: jest.fn().mockResolvedValue(0),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: getRepositoryToken(Settlement),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Merchant),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(PaymentRequest),
          useValue: mockRepository,
        },
        {
          provide: 'CACHE_MANAGER',
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPaymentVolume', () => {
    it('should return cached data if available', async () => {
      mockCacheManager.get.mockResolvedValue([
        { currency: 'USD', totalVolume: 100 },
      ]);
      const result = await service.getPaymentVolume(
        'merchant-1',
        new Date(),
        new Date(),
      );
      expect(result).toEqual([{ currency: 'USD', totalVolume: 100 }]);
      expect(mockRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should query database if cache miss', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      const result = await service.getPaymentVolume(
        'merchant-1',
        new Date(),
        new Date(),
      );
      expect(mockRepository.createQueryBuilder).toHaveBeenCalled();
    });
  });
});
