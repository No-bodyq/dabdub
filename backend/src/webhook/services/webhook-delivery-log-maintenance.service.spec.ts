import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WebhookDeliveryLogMaintenanceService } from './webhook-delivery-log-maintenance.service';
import { WebhookDeliveryLogEntity } from '../../database/entities/webhook-delivery-log.entity';

const mockRepository = {
  query: jest.fn(),
};

describe('WebhookDeliveryLogMaintenanceService', () => {
  let service: WebhookDeliveryLogMaintenanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookDeliveryLogMaintenanceService,
        {
          provide: getRepositoryToken(WebhookDeliveryLogEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<WebhookDeliveryLogMaintenanceService>(
      WebhookDeliveryLogMaintenanceService,
    );
    mockRepository.query.mockReset();
  });

  it('should cleanup expired logs', async () => {
    mockRepository.query.mockResolvedValue({ rowCount: 2 });

    await service.cleanupExpiredLogs();

    expect(mockRepository.query).toHaveBeenCalled();
  });
});
