import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RiskManagementService } from '../services/risk-management.service';
import { RuleEvaluationService } from '../services/rule-evaluation.service';
import { RiskRule, RiskAlert } from '../entities';
import { CreateRiskRuleDto, ResolveAlertDto } from '../dto';
import {
  RiskRuleType,
  RiskSeverity,
  AlertStatus,
  AlertActionType,
} from '../enums';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('RiskManagementService', () => {
  let service: RiskManagementService;
  let riskRuleRepository: jest.Mocked<Repository<RiskRule>>;
  let riskAlertRepository: jest.Mocked<Repository<RiskAlert>>;
  let ruleEvaluationService: RuleEvaluationService;

  const mockRiskRule: RiskRule = {
    id: 'rule-1',
    name: 'High Transaction Amount',
    description: 'Block transactions over $50k',
    ruleType: RiskRuleType.TRANSACTION_AMOUNT,
    conditions: { threshold: 50000, currency: 'USD', comparison: 'gt' },
    severity: RiskSeverity.HIGH,
    isEnabled: true,
    autoBlock: true,
    createdById: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockRiskAlert: RiskAlert = {
    id: 'alert-1',
    severity: RiskSeverity.HIGH,
    type: 'TRANSACTION_AMOUNT',
    message: 'Transaction exceeds threshold',
    affectedTransactionId: 'txn-1',
    affectedMerchantId: 'merchant-1',
    triggeredRuleId: 'rule-1',
    status: AlertStatus.OPEN,
    autoActionTaken: null,
    resolution: null,
    resolvedById: null,
    resolvedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RiskManagementService,
        RuleEvaluationService,
        {
          provide: getRepositoryToken(RiskRule),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(),
            softRemove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(RiskAlert),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RiskManagementService>(RiskManagementService);
    riskRuleRepository = module.get(getRepositoryToken(RiskRule));
    riskAlertRepository = module.get(getRepositoryToken(RiskAlert));
    ruleEvaluationService = module.get<RuleEvaluationService>(
      RuleEvaluationService,
    );
  });

  describe('getRules', () => {
    it('should return all rules when no filter is applied', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockRiskRule]),
      };

      riskRuleRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const result = await service.getRules();

      expect(result).toEqual([mockRiskRule]);
      expect(mockQueryBuilder.getMany).toHaveBeenCalled();
    });

    it('should filter rules by isEnabled', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockRiskRule]),
      };

      riskRuleRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      await service.getRules(true);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'rule.isEnabled = :isEnabled',
        { isEnabled: true },
      );
    });
  });

  describe('getRule', () => {
    it('should return a rule by id', async () => {
      riskRuleRepository.findOne.mockResolvedValue(mockRiskRule);

      const result = await service.getRule('rule-1');

      expect(result).toEqual(mockRiskRule);
      expect(riskRuleRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'rule-1' },
      });
    });

    it('should throw NotFoundException when rule does not exist', async () => {
      riskRuleRepository.findOne.mockResolvedValue(null);

      await expect(service.getRule('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createRule', () => {
    it('should create a new risk rule', async () => {
      const createDto: CreateRiskRuleDto = {
        name: 'Test Rule',
        description: 'Test Description',
        ruleType: RiskRuleType.TRANSACTION_AMOUNT,
        conditions: { threshold: 50000, currency: 'USD' },
        severity: RiskSeverity.HIGH,
      };

      riskRuleRepository.create.mockReturnValue(mockRiskRule);
      riskRuleRepository.save.mockResolvedValue(mockRiskRule);

      const result = await service.createRule(createDto, 'user-1');

      expect(riskRuleRepository.create).toHaveBeenCalledWith({
        ...createDto,
        createdById: 'user-1',
      });
      expect(riskRuleRepository.save).toHaveBeenCalledWith(mockRiskRule);
      expect(result).toEqual(mockRiskRule);
    });
  });

  describe('updateRule', () => {
    it('should update an existing risk rule', async () => {
      const updateDto = { name: 'Updated Rule' };
      riskRuleRepository.findOne.mockResolvedValue(mockRiskRule);
      riskRuleRepository.save.mockResolvedValue({
        ...mockRiskRule,
        name: 'Updated Rule',
      });

      const result = await service.updateRule('rule-1', updateDto);

      expect(result.name).toEqual('Updated Rule');
      expect(riskRuleRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when rule does not exist', async () => {
      riskRuleRepository.findOne.mockResolvedValue(null);

      await expect(service.updateRule('non-existent', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteRule', () => {
    it('should soft delete a risk rule', async () => {
      riskRuleRepository.findOne.mockResolvedValue(mockRiskRule);
      riskRuleRepository.softRemove.mockResolvedValue(mockRiskRule);

      await service.deleteRule('rule-1');

      expect(riskRuleRepository.softRemove).toHaveBeenCalledWith(mockRiskRule);
    });

    it('should throw NotFoundException when rule does not exist', async () => {
      riskRuleRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteRule('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createAlert', () => {
    it('should create a risk alert', async () => {
      riskAlertRepository.create.mockReturnValue(mockRiskAlert);
      riskAlertRepository.save.mockResolvedValue(mockRiskAlert);

      const result = await service.createAlert(
        'rule-1',
        RiskSeverity.HIGH,
        'TRANSACTION_AMOUNT',
        'Transaction exceeds threshold',
        'txn-1',
        'merchant-1',
      );

      expect(riskAlertRepository.create).toHaveBeenCalled();
      expect(riskAlertRepository.save).toHaveBeenCalledWith(mockRiskAlert);
      expect(result).toEqual(mockRiskAlert);
    });
  });

  describe('resolveAlert', () => {
    it('should resolve an open alert', async () => {
      const resolveDto: ResolveAlertDto = {
        resolution: 'This is a legitimate transaction. Customer confirmed.',
        action: AlertActionType.NO_ACTION,
      };

      riskAlertRepository.findOne.mockResolvedValue(mockRiskAlert);
      riskAlertRepository.save.mockResolvedValue({
        ...mockRiskAlert,
        status: AlertStatus.RESOLVED,
        resolution: resolveDto.resolution,
        autoActionTaken: resolveDto.action,
      });

      const result = await service.resolveAlert(
        'alert-1',
        resolveDto,
        'user-1',
      );

      expect(result.status).toEqual(AlertStatus.RESOLVED);
      expect(result.resolution).toEqual(resolveDto.resolution);
    });

    it('should throw error when resolving an already resolved alert', async () => {
      const resolvedAlert = { ...mockRiskAlert, status: AlertStatus.RESOLVED };
      const resolveDto: ResolveAlertDto = {
        resolution: 'This is a legitimate transaction. Customer confirmed.',
        action: AlertActionType.NO_ACTION,
      };

      riskAlertRepository.findOne.mockResolvedValue(resolvedAlert);

      await expect(
        service.resolveAlert('alert-1', resolveDto, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error when resolution note is too short', async () => {
      const resolveDto: ResolveAlertDto = {
        resolution: 'Short',
        action: AlertActionType.NO_ACTION,
      };

      riskAlertRepository.findOne.mockResolvedValue(mockRiskAlert);

      await expect(
        service.resolveAlert('alert-1', resolveDto, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getAlerts', () => {
    it('should return open alerts by default', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockRiskAlert]),
      };

      riskAlertRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const result = await service.getAlerts();

      expect(result).toEqual([mockRiskAlert]);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'alert.status = :status',
        { status: AlertStatus.OPEN },
      );
    });

    it('should filter alerts by status', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      riskAlertRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      await service.getAlerts(AlertStatus.RESOLVED);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'alert.status = :status',
        { status: AlertStatus.RESOLVED },
      );
    });
  });

  describe('getAlert', () => {
    it('should return an alert by id', async () => {
      riskAlertRepository.findOne.mockResolvedValue(mockRiskAlert);

      const result = await service.getAlert('alert-1');

      expect(result).toEqual(mockRiskAlert);
      expect(riskAlertRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'alert-1' },
      });
    });

    it('should throw NotFoundException when alert does not exist', async () => {
      riskAlertRepository.findOne.mockResolvedValue(null);

      await expect(service.getAlert('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getFlaggedTransactions', () => {
    it('should return flagged transactions with triggered rules', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockRiskAlert]),
      };

      riskAlertRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const result = await service.getFlaggedTransactions();

      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty('transactionId');
      expect(result[0]).toHaveProperty('triggeredRules');
    });
  });

  describe('getFlaggedMerchants', () => {
    it('should return flagged merchants grouped by id', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          {
            alert_affectedMerchantId: 'merchant-1',
            alertCount: '5',
            maxSeverity: 'HIGH',
          },
        ]),
      };

      riskAlertRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const result = await service.getFlaggedMerchants();

      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty('merchantId');
      expect(result[0]).toHaveProperty('alertCount');
    });
  });
});
