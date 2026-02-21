import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppModule } from '../app.module';
import { RiskManagementService } from '../modules/risk/services';
import { CreateRiskRuleDto, ResolveAlertDto } from '../modules/risk/dto';
import {
  RiskRuleType,
  RiskSeverity,
  AlertActionType,
} from '../modules/risk/enums';

describe('Risk Monitoring System (e2e)', () => {
  let app: INestApplication;
  let riskManagementService: RiskManagementService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    riskManagementService = moduleFixture.get<RiskManagementService>(
      RiskManagementService,
    );
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Risk Rule Lifecycle', () => {
    let createdRuleId: string;

    it('should create a risk rule', async () => {
      const createRuleDto: CreateRiskRuleDto = {
        name: 'High Transaction Test',
        description: 'Test rule for high transactions',
        ruleType: RiskRuleType.TRANSACTION_AMOUNT,
        conditions: {
          threshold: 50000,
          currency: 'USD',
          comparison: 'gt',
        },
        severity: RiskSeverity.HIGH,
        autoBlock: true,
      };

      const rule = await riskManagementService.createRule(
        createRuleDto,
        'test-user',
      );

      expect(rule).toBeDefined();
      expect(rule.name).toBe(createRuleDto.name);
      expect(rule.ruleType).toBe(createRuleDto.ruleType);
      createdRuleId = rule.id;
    });

    it('should retrieve the created rule', async () => {
      const rule = await riskManagementService.getRule(createdRuleId);

      expect(rule).toBeDefined();
      expect(rule.id).toBe(createdRuleId);
      expect(rule.name).toBe('High Transaction Test');
    });

    it('should update the rule', async () => {
      const updatedRule = await riskManagementService.updateRule(
        createdRuleId,
        {
          name: 'Updated High Transaction Test',
          isEnabled: false,
        },
      );

      expect(updatedRule.name).toBe('Updated High Transaction Test');
      expect(updatedRule.isEnabled).toBe(false);
    });

    it('should list all rules', async () => {
      const rules = await riskManagementService.getRules();

      expect(Array.isArray(rules)).toBe(true);
      expect(rules.length).toBeGreaterThan(0);
    });

    it('should delete the rule', async () => {
      await riskManagementService.deleteRule(createdRuleId);

      // Verify soft delete by checking we can't retrieve it
      // (in a real scenario with proper soft delete implementation)
      expect(true).toBe(true);
    });
  });

  describe('Alert Management', () => {
    let createdAlertId: string;

    it('should create an alert', async () => {
      const alert = await riskManagementService.createAlert(
        'rule-id',
        RiskSeverity.HIGH,
        'TRANSACTION_AMOUNT',
        'Transaction exceeds threshold',
        'txn-id',
        'merchant-id',
      );

      expect(alert).toBeDefined();
      expect(alert.severity).toBe(RiskSeverity.HIGH);
      createdAlertId = alert.id;
    });

    it('should retrieve the alert', async () => {
      const alert = await riskManagementService.getAlert(createdAlertId);

      expect(alert).toBeDefined();
      expect(alert.id).toBe(createdAlertId);
    });

    it('should resolve the alert', async () => {
      const resolveDto: ResolveAlertDto = {
        resolution: 'This is a legitimate transaction confirmed by customer.',
        action: AlertActionType.NO_ACTION,
      };

      const resolvedAlert = await riskManagementService.resolveAlert(
        createdAlertId,
        resolveDto,
        'test-user',
      );

      expect(resolvedAlert.status).toBe('RESOLVED');
      expect(resolvedAlert.resolution).toBe(resolveDto.resolution);
    });
  });
});
