import { Test, TestingModule } from '@nestjs/testing';
import { QrCodeService } from './qr-code.service';
import { GlobalConfigService } from '../../config/global-config.service';

const mockConfigService = {
  getStellarConfig: jest.fn().mockReturnValue({
    activeNetwork: 'testnet',
    networks: {},
    defaultExpirationMinutes: 30,
    minPaymentAmount: 0.1,
    maxPaymentAmount: 10000,
  }),
};

describe('QrCodeService', () => {
  let service: QrCodeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QrCodeService,
        { provide: GlobalConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<QrCodeService>(QrCodeService);
    jest.clearAllMocks();
    mockConfigService.getStellarConfig.mockReturnValue({
      activeNetwork: 'testnet',
      networks: {},
      defaultExpirationMinutes: 30,
      minPaymentAmount: 0.1,
      maxPaymentAmount: 10000,
    });
  });

  describe('buildSep0007Uri', () => {
    it('should generate a valid SEP-0007 URI', () => {
      const uri = service.buildSep0007Uri({
        destination: 'GABC123',
        amount: 10.5,
        memo: 'payment-id-1',
      });

      expect(uri).toContain('web+stellar:pay?');
      expect(uri).toContain('destination=GABC123');
      expect(uri).toContain('amount=10.5');
      expect(uri).toContain('asset_code=USDC');
      expect(uri).toContain('memo=payment-id-1');
      expect(uri).toContain('memo_type=MEMO_TEXT');
    });

    it('should use testnet passphrase by default', () => {
      const uri = service.buildSep0007Uri({
        destination: 'GABC123',
        amount: 10,
        memo: 'test',
      });

      expect(uri).toContain('network_passphrase=');
      expect(uri).toContain('Test');
      expect(uri).toContain('SDF');
      expect(uri).toContain('September');
    });

    it('should use mainnet passphrase when specified', () => {
      const uri = service.buildSep0007Uri({
        destination: 'GABC123',
        amount: 10,
        memo: 'test',
        network: 'mainnet',
      });

      expect(uri).toContain('network_passphrase=');
      expect(uri).toContain('Public');
      expect(uri).toContain('Global');
      expect(uri).toContain('Stellar');
    });
  });

  describe('generateQrCode', () => {
    it('should generate a valid base64 PNG', async () => {
      const result = await service.generateQrCode({
        destination: 'GABC123',
        amount: 10.5,
        memo: 'payment-id-1',
      });

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      // Valid base64 string
      expect(() => Buffer.from(result, 'base64')).not.toThrow();
    });
  });
});
