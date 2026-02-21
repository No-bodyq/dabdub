import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WebhookDeliveryService } from './webhook-delivery.service';
import { WebhookConfigurationEntity } from '../../database/entities/webhook-configuration.entity';
import {
  WebhookDeliveryLogEntity,
  WebhookDeliveryStatus,
} from '../../database/entities/webhook-delivery-log.entity';
import { createHmac } from 'crypto';

const mockConfigRepository = {
  findOne: jest.fn(),
  save: jest.fn((data: WebhookConfigurationEntity) => Promise.resolve(data)),
};

const mockLogRepository: {
  create: jest.Mock<
    WebhookDeliveryLogEntity,
    [Partial<WebhookDeliveryLogEntity>]
  >;
  save: jest.Mock<
    Promise<WebhookDeliveryLogEntity>,
    [WebhookDeliveryLogEntity]
  >;
} = {
  create: jest.fn(
    (data: Partial<WebhookDeliveryLogEntity>) =>
      ({
        ...data,
      }) as WebhookDeliveryLogEntity,
  ),
  save: jest.fn((data: WebhookDeliveryLogEntity) => Promise.resolve(data)),
};

const getHeaderValue = (
  headers: HeadersInit | undefined,
  name: string,
): string | undefined => {
  if (!headers) {
    return undefined;
  }
  if (headers instanceof Headers) {
    return headers.get(name) ?? undefined;
  }
  if (Array.isArray(headers)) {
    return headers.find(([key]) => key === name)?.[1];
  }
  return headers[name];
};

describe('WebhookDeliveryService', () => {
  let service: WebhookDeliveryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookDeliveryService,
        {
          provide: getRepositoryToken(WebhookConfigurationEntity),
          useValue: mockConfigRepository,
        },
        {
          provide: getRepositoryToken(WebhookDeliveryLogEntity),
          useValue: mockLogRepository,
        },
      ],
    }).compile();

    service = module.get<WebhookDeliveryService>(WebhookDeliveryService);

    mockConfigRepository.findOne.mockReset();
    mockConfigRepository.save.mockClear();
    mockLogRepository.create.mockClear();
    mockLogRepository.save.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should log a successful webhook delivery', async () => {
    mockConfigRepository.findOne.mockResolvedValue({
      id: 'wh_1',
      url: 'https://example.com/webhook',
      isActive: true,
      events: ['payment_request.created'],
      retryAttempts: 1,
      retryDelayMs: 10,
      timeoutMs: 3000,
      secret: 'test-secret',
      maxFailureCount: 5,
      failureCount: 0,
      batchEnabled: false,
    });

    const fetchMock = jest.spyOn(global, 'fetch' as any).mockResolvedValue({
      status: 200,
      headers: new Map([['content-type', 'application/json']]),
      text: () => Promise.resolve('ok'),
    } as any);

    await service.deliverWebhook('wh_1', 'payment_request.created', {
      foo: 'bar',
    });

    expect(fetchMock).toHaveBeenCalled();
    expect(mockLogRepository.save).toHaveBeenCalledTimes(1);

    const savedLog = mockLogRepository.save.mock.calls[0][0];
    expect(savedLog.status).toBe(WebhookDeliveryStatus.DELIVERED);
    expect(savedLog.payloadSnapshotEncoding).toBe('gzip');
    expect(savedLog.payloadSnapshotSize).toBeGreaterThan(0);

    const fetchOptions = fetchMock.mock.calls[0]?.[1] as
      | RequestInit
      | undefined;
    const signatureHeader = getHeaderValue(
      fetchOptions?.headers,
      'X-Dabdub-Signature',
    );
    expect(signatureHeader).toBeDefined();
  });

  it('should retry and log failed attempts', async () => {
    mockConfigRepository.findOne.mockResolvedValue({
      id: 'wh_2',
      url: 'https://example.com/webhook',
      isActive: true,
      events: ['payment_request.created'],
      retryAttempts: 2,
      retryDelayMs: 1,
      timeoutMs: 3000,
      secret: 'test-secret',
      maxFailureCount: 5,
      failureCount: 0,
      batchEnabled: false,
    });

    const fetchMock = jest
      .spyOn(global, 'fetch' as any)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        status: 204,
        headers: new Map(),
        text: () => Promise.resolve(''),
      } as any);

    jest.spyOn(service as any, 'sleep').mockResolvedValue(undefined);

    await service.deliverWebhook('wh_2', 'payment_request.created', {
      foo: 'bar',
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(mockLogRepository.save).toHaveBeenCalledTimes(2);

    const firstLog = mockLogRepository.save.mock.calls[0][0];
    const secondLog = mockLogRepository.save.mock.calls[1][0];

    expect(firstLog.status).toBe(WebhookDeliveryStatus.FAILED);
    expect(firstLog.nextRetryAt).toBeDefined();
    expect(secondLog.status).toBe(WebhookDeliveryStatus.DELIVERED);
  });

  it('should verify webhook signatures', () => {
    const payload = { id: 'evt_1', event: 'payment_request.created' };
    const payloadString = service.serializePayloadForVerification(payload);
    const timestamp = 1700000000;
    const signature = createHmac('sha256', 'verify-secret')
      .update(`${timestamp}.${payloadString}`)
      .digest('hex');

    const header = `t=${timestamp},v1=${signature}`;
    const isValid = service.verifySignature(
      payloadString,
      'verify-secret',
      header,
    );
    expect(isValid).toBe(true);
  });
});
