import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { RiskRule, RiskAlert } from "../entities";
import { CreateRiskRuleDto, UpdateRiskRuleDto, ResolveAlertDto } from "../dto";
import { AlertStatus } from "../enums";
import {
  RuleEvaluationService,
  TransactionData,
  MerchantData,
} from "./rule-evaluation.service";

@Injectable()
export class RiskManagementService {
  private readonly logger = new Logger(RiskManagementService.name);

  constructor(
    @InjectRepository(RiskRule)
    private riskRuleRepository: Repository<RiskRule>,
    @InjectRepository(RiskAlert)
    private riskAlertRepository: Repository<RiskAlert>,
    private ruleEvaluationService: RuleEvaluationService,
  ) {}

  /**
   * Get all risk rules with optional filtering
   */
  async getRules(isEnabled?: boolean) {
    const query = this.riskRuleRepository.createQueryBuilder("rule");

    if (isEnabled !== undefined) {
      query.where("rule.isEnabled = :isEnabled", { isEnabled });
    }

    return query.orderBy("rule.createdAt", "DESC").getMany();
  }

  /**
   * Get a single risk rule by ID
   */
  async getRule(id: string): Promise<RiskRule> {
    const rule = await this.riskRuleRepository.findOne({ where: { id } });
    if (!rule) {
      throw new NotFoundException(`Risk rule with ID ${id} not found`);
    }
    return rule;
  }

  /**
   * Create a new risk rule
   */
  async createRule(
    createRiskRuleDto: CreateRiskRuleDto,
    userId: string,
  ): Promise<RiskRule> {
    const rule = this.riskRuleRepository.create({
      ...createRiskRuleDto,
      createdById: userId,
    });

    return this.riskRuleRepository.save(rule);
  }

  /**
   * Update a risk rule
   */
  async updateRule(
    id: string,
    updateRiskRuleDto: UpdateRiskRuleDto,
  ): Promise<RiskRule> {
    const rule = await this.getRule(id);

    Object.assign(rule, updateRiskRuleDto);
    return this.riskRuleRepository.save(rule);
  }

  /**
   * Delete (soft delete) a risk rule - SUPER_ADMIN only
   */
  async deleteRule(id: string): Promise<void> {
    const rule = await this.getRule(id);
    await this.riskRuleRepository.softRemove(rule);
  }

  /**
   * Get all flagged transactions
   */
  async getFlaggedTransactions() {
    const alerts = await this.riskAlertRepository
      .createQueryBuilder("alert")
      .where("alert.affectedTransactionId IS NOT NULL")
      .leftJoinAndSelect(
        "risk_rules",
        "rule",
        "rule.id = alert.triggeredRuleId",
      )
      .orderBy("alert.createdAt", "DESC")
      .getMany();

    return alerts.map((alert) => ({
      transactionId: alert.affectedTransactionId,
      severity: alert.severity,
      triggeredRules: [
        {
          ruleId: alert.triggeredRuleId,
          type: alert.type,
          message: alert.message,
        },
      ],
      alertId: alert.id,
      createdAt: alert.createdAt,
    }));
  }

  /**
   * Get all flagged merchants
   */
  async getFlaggedMerchants() {
    const alerts = await this.riskAlertRepository
      .createQueryBuilder("alert")
      .where("alert.affectedMerchantId IS NOT NULL")
      .groupBy("alert.affectedMerchantId")
      .addSelect("COUNT(alert.id)", "alertCount")
      .addSelect("MAX(alert.severity)", "maxSeverity")
      .orderBy("alertCount", "DESC")
      .getRawMany();

    return alerts.map((row) => ({
      merchantId: row.alert_affectedMerchantId,
      alertCount: parseInt(row.alertCount, 10),
      maxSeverity: row.maxSeverity,
    }));
  }

  /**
   * Get all active risk alerts
   */
  async getAlerts(status?: AlertStatus) {
    const query = this.riskAlertRepository.createQueryBuilder("alert");

    if (status) {
      query.where("alert.status = :status", { status });
    } else {
      query.where("alert.status = :status", { status: AlertStatus.OPEN });
    }

    return query.orderBy("alert.createdAt", "DESC").getMany();
  }

  /**
   * Get a single alert
   */
  async getAlert(id: string): Promise<RiskAlert> {
    const alert = await this.riskAlertRepository.findOne({ where: { id } });
    if (!alert) {
      throw new NotFoundException(`Alert with ID ${id} not found`);
    }
    return alert;
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(
    id: string,
    resolveAlertDto: ResolveAlertDto,
    userId: string,
  ): Promise<RiskAlert> {
    const alert = await this.getAlert(id);

    if (alert.status === AlertStatus.RESOLVED) {
      throw new BadRequestException("Alert is already resolved");
    }

    if (resolveAlertDto.resolution.length < 20) {
      throw new BadRequestException(
        "Resolution note must be at least 20 characters",
      );
    }

    alert.status = AlertStatus.RESOLVED;
    alert.resolution = resolveAlertDto.resolution;
    alert.autoActionTaken = resolveAlertDto.action;
    alert.resolvedById = userId;
    alert.resolvedAt = new Date();

    return this.riskAlertRepository.save(alert);
  }

  /**
   * Create an alert from a rule trigger
   */
  async createAlert(
    triggeredRuleId: string,
    severity: string,
    type: string,
    message: string,
    transactionId?: string,
    merchantId?: string,
    autoAction?: string,
  ): Promise<RiskAlert> {
    const alert = this.riskAlertRepository.create({
      triggeredRuleId,
      severity,
      type,
      message,
      affectedTransactionId: transactionId,
      affectedMerchantId: merchantId,
      autoActionTaken: autoAction,
    });

    return this.riskAlertRepository.save(alert);
  }

  /**
   * Evaluate a transaction against all enabled rules
   */
  async evaluateTransaction(transactionData: TransactionData) {
    const enabledRules = await this.getRules(true);
    const triggeredRules = [];

    for (const rule of enabledRules) {
      const isTriggered =
        this.ruleEvaluationService.evaluateTransactionAgainstRule(
          rule.ruleType,
          rule.conditions,
          transactionData,
        );

      if (isTriggered) {
        triggeredRules.push({
          rule,
          triggered: true,
        });

        // Create alert for triggered rule
        await this.createAlert(
          rule.id,
          rule.severity,
          rule.ruleType,
          `Transaction ${transactionData.merchantId} triggered ${rule.name}`,
          transactionData.merchantId,
          null,
          rule.autoBlock ? "REJECTED_TRANSACTION" : null,
        );
      }
    }

    return triggeredRules;
  }
}
