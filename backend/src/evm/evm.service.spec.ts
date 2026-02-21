import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EVMService } from './evm.service';
import { parseUnits } from 'viem';

// Mock viem functions
jest.mock('viem', () => {
  return {
    createPublicClient: jest.fn(),
    createWalletClient: jest.fn(),
    http: jest.fn(),
    fallback: jest.fn(),
    parseUnits: jest.fn((val) => val), // Simple mock
    formatUnits: jest.fn((val) => val),
    defineChain: jest.fn(),
    parseAbiItem: jest.fn(),
  };
});

jest.mock('viem/accounts', () => {
  return {
    generatePrivateKey: jest.fn(() => '0xPRIVATE_KEY'),
    privateKeyToAccount: jest.fn(() => ({ address: '0x123' })),
  };
});

// We need to import the mocked module to access the mock functions
import * as viem from 'viem';

describe('EVMService', () => {
  let service: EVMService;
  let configService: ConfigService;

  const mockPublicClient = {
    getBalance: jest.fn(),
    readContract: jest.fn(),
    getTransactionReceipt: jest.fn(),
    getBlockNumber: jest.fn(),
  };

  const mockWalletClient = {
    writeContract: jest.fn(),
  };

  beforeEach(async () => {
    (viem.createPublicClient as jest.Mock).mockReturnValue(mockPublicClient);
    (viem.createWalletClient as jest.Mock).mockReturnValue(mockWalletClient);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EVMService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EVMService>(EVMService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should initialize clients for all supported chains', () => {
      service.onModuleInit();
      // We have 5 supported chains in constants
      // But we filter by empty RPC URLs.
      // In test env, constants might load defaults.
      // Assuming default constants have RPCs (which they do in my implementation)
      expect(viem.createPublicClient).toHaveBeenCalled();
    });
  });

  describe('createWallet', () => {
    it('should return a new wallet', async () => {
      const wallet = await service.createWallet();
      expect(wallet).toHaveProperty('address', '0x123');
      expect(wallet).toHaveProperty('privateKey', '0xPRIVATE_KEY');
    });
  });

  describe('getNativeBalance', () => {
    it('should return balance string', async () => {
      service.onModuleInit(); // Ensure clients are init
      mockPublicClient.getBalance.mockResolvedValue(1000000000000000000n);

      const balance = await service.getNativeBalance(137, '0xAddress');
      expect(balance).toBe('1000000000000000000');
      expect(mockPublicClient.getBalance).toHaveBeenCalled();
    });
  });

  describe('getUSDCBalance', () => {
    it('should return USDC balance', async () => {
      service.onModuleInit();
      mockPublicClient.readContract.mockResolvedValue(1000000n);

      const balance = await service.getUSDCBalance(137, '0xAddress');
      expect(balance).toBe('1000000');
    });
  });
});
