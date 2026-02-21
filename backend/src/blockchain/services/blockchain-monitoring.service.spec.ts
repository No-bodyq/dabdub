import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BlockchainMonitoringService } from './blockchain-monitoring.service';
import {
  BlockchainNetwork,
  BlockchainType,
} from '../entities/blockchain-network.entity';
import { BlockchainBlockCursor } from '../entities/blockchain-block-cursor.entity';
import {
  PaymentRequest,
  PaymentRequestStatus,
} from '../entities/payment-request.entity';
import { StellarClientService } from './stellar-client.service';
import { Repository } from 'typeorm';

describe('BlockchainMonitoringService', () => {
  let service: BlockchainMonitoringService;
  let networkRepo: Repository<BlockchainNetwork>;
  let cursorRepo: Repository<BlockchainBlockCursor>;
  let paymentRequestRepo: Repository<PaymentRequest>;
  let stellarClient: StellarClientService;

  const mockNetwork: BlockchainNetwork = {
    id: 'net-1',
    name: 'Stellar Testnet',
    type: BlockchainType.STELLAR,
    rpcUrl: 'http://localhost:8000',
    chainId: 1,
    symbol: 'XLM',
    isActive: true,
    monitoringInterval: 5000,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlockchainMonitoringService,
        {
          provide: getRepositoryToken(BlockchainNetwork),
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockNetwork),
          },
        },
        {
          provide: getRepositoryToken(BlockchainBlockCursor),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn().mockImplementation((dto) => dto),
            save: jest.fn().mockImplementation((cursor) => cursor),
          },
        },
        {
          provide: getRepositoryToken(PaymentRequest),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: StellarClientService,
          useValue: {
            getLatestBlockNumber: jest.fn(),
            getBlock: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BlockchainMonitoringService>(
      BlockchainMonitoringService,
    );
    networkRepo = module.get(getRepositoryToken(BlockchainNetwork));
    cursorRepo = module.get(getRepositoryToken(BlockchainBlockCursor));
    paymentRequestRepo = module.get(getRepositoryToken(PaymentRequest));
    stellarClient = module.get(StellarClientService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('monitorNetwork', () => {
    it('should scan new blocks and match transactions', async () => {
      const networkId = 'net-1';
      const lastBlock = 100n;
      const latestBlock = 105n;

      jest
        .spyOn(stellarClient, 'getLatestBlockNumber')
        .mockResolvedValue(latestBlock);
      jest.spyOn(cursorRepo, 'findOne').mockResolvedValue({
        id: 'cur-1',
        networkId,
        lastProcessedBlock: lastBlock.toString(),
        updatedAt: new Date(),
      } as BlockchainBlockCursor);

      jest.spyOn(stellarClient, 'getBlock').mockImplementation(async (num) => ({
        number: num.toString(),
        hash: `hash-${num}`,
        timestamp: new Date(),
        transactions:
          num === 102n
            ? [
                {
                  hash: 'tx-123',
                  from: 'ADDR1',
                  to: 'ADDR2',
                  amount: '100',
                  memo: 'REF-1',
                  timestamp: new Date(),
                  blockNumber: '102',
                },
              ]
            : [],
      }));

      const mockPaymentRequest = {
        id: 'pay-1',
        status: PaymentRequestStatus.PENDING,
        amount: 100,
        recipientAddress: 'ADDR2',
        paymentReference: 'REF-1',
      } as PaymentRequest;

      jest
        .spyOn(paymentRequestRepo, 'findOne')
        .mockResolvedValue(mockPaymentRequest);

      await service.monitorNetwork(networkId);

      expect(stellarClient.getBlock).toHaveBeenCalledTimes(5); // 101 to 105
      expect(paymentRequestRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'pay-1',
          status: PaymentRequestStatus.COMPLETED,
          txHash: 'tx-123',
        }),
      );
      expect(cursorRepo.save).toHaveBeenCalledTimes(5);
    });
  });
});
