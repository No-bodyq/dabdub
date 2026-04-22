import { AdminAlertService } from './admin-alert.service';
import { AdminAlertStatus, AdminAlertType } from './admin-alert.entity';

describe('AdminAlertService', () => {
  const save = jest.fn((entity: unknown) => entity);
  const findOne = jest.fn();
  const repo = {
    create: jest.fn((entity: unknown) => entity),
    save,
    findOne,
    find: jest.fn(),
  };
  const gateway = {
    emitToAdmins: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('suppresses duplicate notifications during cooldown', async () => {
    findOne.mockResolvedValue({
      id: 'alert-1',
      type: AdminAlertType.REDIS_HEALTH,
      dedupeKey: 'redis',
      status: AdminAlertStatus.OPEN,
      message: 'old',
      occurrenceCount: 1,
      thresholdValue: 1,
      metadata: null,
      lastNotifiedAt: new Date(),
      acknowledgedAt: null,
      acknowledgedBy: null,
    });

    const service = new AdminAlertService(
      repo as never,
      {
        cooldownMinutes: 30,
        emailRecipient: null,
        slackWebhookUrl: null,
        redisFailureThreshold: 1,
        stellarFailureThreshold: 1,
      } as never,
      {
        apiKey: 'zepto-key',
        fromEmail: 'alerts@example.com',
      } as never,
      gateway as never,
    );

    const result = await service.raise({
      type: AdminAlertType.REDIS_HEALTH,
      dedupeKey: 'redis',
      message: 'Redis is down',
      thresholdValue: 1,
    });

    expect(result?.occurrenceCount).toBe(2);
    expect(gateway.emitToAdmins).not.toHaveBeenCalled();
  });
});
