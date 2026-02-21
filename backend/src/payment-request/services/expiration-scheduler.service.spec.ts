import { Test, TestingModule } from '@nestjs/testing';
import { ExpirationSchedulerService } from './expiration-scheduler.service';
import { PaymentRequestRepository } from '../repositories/payment-request.repository';
import { PaymentRequestStatus } from '../../database/entities/payment-request.entity';

const mockRepository = {
  findExpired: jest.fn(),
  updateBatchStatus: jest.fn(),
  update: jest.fn(),
};

describe('ExpirationSchedulerService', () => {
  let service: ExpirationSchedulerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpirationSchedulerService,
        { provide: PaymentRequestRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<ExpirationSchedulerService>(
      ExpirationSchedulerService,
    );

    jest.clearAllMocks();
  });

  describe('handleExpiredRequests', () => {
    it('should find and expire pending requests past deadline', async () => {
      const expired = [
        {
          id: '1',
          status: PaymentRequestStatus.PENDING,
          statusHistory: [],
          expiresAt: new Date(Date.now() - 60000),
        },
        {
          id: '2',
          status: PaymentRequestStatus.PENDING,
          statusHistory: [],
          expiresAt: new Date(Date.now() - 120000),
        },
      ];
      mockRepository.findExpired.mockResolvedValue(expired);
      mockRepository.updateBatchStatus.mockResolvedValue(undefined);
      mockRepository.update.mockResolvedValue(undefined);

      await service.handleExpiredRequests();

      expect(mockRepository.findExpired).toHaveBeenCalled();
      expect(mockRepository.updateBatchStatus).toHaveBeenCalledWith(
        ['1', '2'],
        PaymentRequestStatus.EXPIRED,
      );
      expect(mockRepository.update).toHaveBeenCalledTimes(2);
    });

    it('should skip when no expired requests found', async () => {
      mockRepository.findExpired.mockResolvedValue([]);

      await service.handleExpiredRequests();

      expect(mockRepository.updateBatchStatus).not.toHaveBeenCalled();
    });

    it('should update status history for each expired request', async () => {
      const expired = [
        {
          id: '1',
          status: PaymentRequestStatus.PENDING,
          statusHistory: [
            { status: 'pending', timestamp: '2024-01-01T00:00:00.000Z' },
          ],
          expiresAt: new Date(Date.now() - 60000),
        },
      ];
      mockRepository.findExpired.mockResolvedValue(expired);
      mockRepository.updateBatchStatus.mockResolvedValue(undefined);
      mockRepository.update.mockResolvedValue(undefined);

      await service.handleExpiredRequests();

      expect(mockRepository.update).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          statusHistory: expect.arrayContaining([
            expect.objectContaining({
              status: PaymentRequestStatus.EXPIRED,
              reason: 'Expired by scheduler',
            }),
          ]),
        }),
      );
    });

    it('should handle null statusHistory gracefully', async () => {
      const expired = [
        {
          id: '1',
          status: PaymentRequestStatus.PENDING,
          statusHistory: null,
          expiresAt: new Date(Date.now() - 60000),
        },
      ];
      mockRepository.findExpired.mockResolvedValue(expired);
      mockRepository.updateBatchStatus.mockResolvedValue(undefined);
      mockRepository.update.mockResolvedValue(undefined);

      await service.handleExpiredRequests();

      expect(mockRepository.update).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          statusHistory: [
            expect.objectContaining({
              status: PaymentRequestStatus.EXPIRED,
            }),
          ],
        }),
      );
    });
  });
});
