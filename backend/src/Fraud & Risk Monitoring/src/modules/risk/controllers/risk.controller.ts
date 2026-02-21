import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from "@nestjs/common";
import { RiskManagementService } from "../services/risk-management.service";
import { CreateRiskRuleDto, UpdateRiskRuleDto, ResolveAlertDto } from "../dto";
import { Permission, PermissionGuard } from "../../../common/guards";
import { AlertStatus } from "../enums";

// Mock decorator to get current user (in production, use @AuthUser() or similar)
const CurrentUser =
  () => (target: any, key: string, descriptor: PropertyDescriptor) => {};

@Controller("api/v1/risk")
@UseGuards(PermissionGuard)
export class RiskController {
  constructor(private readonly riskManagementService: RiskManagementService) {}

  /**
   * GET /api/v1/risk/rules
   * List all risk rules
   */
  @Get("rules")
  @Permission("risk:manage")
  async getRules(@Query("enabled") enabled?: string) {
    const isEnabled =
      enabled === "true" ? true : enabled === "false" ? false : undefined;
    return this.riskManagementService.getRules(isEnabled);
  }

  /**
   * GET /api/v1/risk/rules/:id
   * Get a specific risk rule
   */
  @Get("rules/:id")
  @Permission("risk:manage")
  async getRule(@Param("id") id: string) {
    return this.riskManagementService.getRule(id);
  }

  /**
   * POST /api/v1/risk/rules
   * Create a new risk rule
   */
  @Post("rules")
  @Permission("risk:manage")
  async createRule(@Body() createRiskRuleDto: CreateRiskRuleDto) {
    // In production, get userId from authenticated user context
    const userId = "system-user";
    return this.riskManagementService.createRule(createRiskRuleDto, userId);
  }

  /**
   * PATCH /api/v1/risk/rules/:id
   * Update a risk rule
   */
  @Patch("rules/:id")
  @Permission("risk:manage")
  async updateRule(
    @Param("id") id: string,
    @Body() updateRiskRuleDto: UpdateRiskRuleDto,
  ) {
    return this.riskManagementService.updateRule(id, updateRiskRuleDto);
  }

  /**
   * DELETE /api/v1/risk/rules/:id
   * Delete (soft delete) a risk rule - SUPER_ADMIN only
   */
  @Delete("rules/:id")
  @Permission("risk:manage")
  async deleteRule(@Param("id") id: string) {
    await this.riskManagementService.deleteRule(id);
    return { message: "Rule deleted successfully" };
  }

  /**
   * GET /api/v1/risk/flagged-transactions
   * Get all flagged transactions
   */
  @Get("flagged-transactions")
  @Permission("risk:manage")
  async getFlaggedTransactions() {
    return this.riskManagementService.getFlaggedTransactions();
  }

  /**
   * GET /api/v1/risk/flagged-merchants
   * Get all flagged merchants
   */
  @Get("flagged-merchants")
  @Permission("risk:manage")
  async getFlaggedMerchants() {
    return this.riskManagementService.getFlaggedMerchants();
  }

  /**
   * GET /api/v1/risk/alerts
   * Get all active risk alerts
   */
  @Get("alerts")
  @Permission("risk:manage")
  async getAlerts(@Query("status") status?: AlertStatus) {
    return this.riskManagementService.getAlerts(status);
  }

  /**
   * GET /api/v1/risk/alerts/:id
   * Get a specific alert
   */
  @Get("alerts/:id")
  @Permission("risk:manage")
  async getAlert(@Param("id") id: string) {
    const alert = await this.riskManagementService.getAlert(id);
    return {
      id: alert.id,
      severity: alert.severity,
      type: alert.type,
      message: alert.message,
      affectedTransactionId: alert.affectedTransactionId,
      affectedMerchantId: alert.affectedMerchantId,
      triggeredRuleId: alert.triggeredRuleId,
      status: alert.status,
      autoActionTaken: alert.autoActionTaken,
      createdAt: alert.createdAt,
    };
  }

  /**
   * POST /api/v1/risk/alerts/:id/resolve
   * Resolve an alert
   */
  @Post("alerts/:id/resolve")
  @Permission("risk:manage")
  async resolveAlert(
    @Param("id") id: string,
    @Body() resolveAlertDto: ResolveAlertDto,
  ) {
    // In production, get userId from authenticated user context
    const userId = "system-user";
    const alert = await this.riskManagementService.resolveAlert(
      id,
      resolveAlertDto,
      userId,
    );

    return {
      id: alert.id,
      severity: alert.severity,
      type: alert.type,
      message: alert.message,
      affectedTransactionId: alert.affectedTransactionId,
      affectedMerchantId: alert.affectedMerchantId,
      triggeredRuleId: alert.triggeredRuleId,
      status: alert.status,
      autoActionTaken: alert.autoActionTaken,
      resolution: alert.resolution,
      resolvedAt: alert.resolvedAt,
      createdAt: alert.createdAt,
    };
  }
}
