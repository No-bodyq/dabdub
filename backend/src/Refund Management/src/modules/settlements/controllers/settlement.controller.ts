import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { SettlementService } from "../services/settlement.service";
import {
  TriggerSettlementDto,
  PutSettlementOnHoldDto,
  SettlementResponseDto,
  SettlementListResponseDto,
  SettlementPendingDashboardDto,
} from "../dtos/settlement.dto";
import { RequirePermissions, CurrentUser } from "../../../common/decorators";
import { Settlement } from "../entities/settlement.entity";

@ApiTags("Settlements")
@Controller("api/v1/settlements")
export class SettlementController {
  constructor(private settlementService: SettlementService) {}

  @Get()
  @RequirePermissions("settlements:read")
  @ApiOperation({ summary: "List settlements with filters and pagination" })
  @ApiResponse({
    status: 200,
    description: "Settlements retrieved successfully",
  })
  async listSettlements(
    @Query("merchantId") merchantId?: string,
    @Query("status") status?: string,
    @Query("currency") currency?: string,
    @Query("createdAfter") createdAfter?: string,
    @Query("createdBefore") createdBefore?: string,
    @Query("minAmount") minAmount?: string,
    @Query("maxAmount") maxAmount?: string,
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 20,
    @Query("sortBy") sortBy: string = "createdAt",
    @Query("sortOrder") sortOrder: "ASC" | "DESC" = "DESC",
  ): Promise<SettlementListResponseDto> {
    const filters: any = {
      ...(merchantId && { merchantId }),
      ...(status && { status }),
      ...(currency && { currency }),
      ...(createdAfter && { createdAfter: new Date(createdAfter) }),
      ...(createdBefore && { createdBefore: new Date(createdBefore) }),
      ...(minAmount && { minAmount: parseFloat(minAmount) }),
      ...(maxAmount && { maxAmount: parseFloat(maxAmount) }),
    };

    const result = await this.settlementService.listSettlements(
      filters,
      Number(page),
      Number(limit),
      sortBy,
      sortOrder,
    );

    return {
      data: result.data.map((s) => this.mapToResponseDto(s)),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  @Get("pending")
  @RequirePermissions("settlements:read")
  @ApiOperation({ summary: "Get pending settlements dashboard" })
  @ApiResponse({
    status: 200,
    description: "Pending settlements dashboard retrieved successfully",
  })
  async getPendingDashboard(): Promise<SettlementPendingDashboardDto> {
    return this.settlementService.getPendingDashboard();
  }

  @Get(":id")
  @RequirePermissions("settlements:read")
  @ApiOperation({ summary: "Get settlement detail" })
  @ApiResponse({
    status: 200,
    description: "Settlement retrieved successfully",
  })
  async getSettlement(
    @Param("id") settlementId: string,
  ): Promise<SettlementResponseDto> {
    const settlement = await this.settlementService.getSettlement(settlementId);
    return this.mapToResponseDto(settlement);
  }

  @Post(":id/retry")
  @HttpCode(200)
  @RequirePermissions("settlements:trigger")
  @ApiOperation({ summary: "Retry failed settlement" })
  @ApiResponse({ status: 200, description: "Settlement retry initiated" })
  async retrySettlement(
    @Param("id") settlementId: string,
    @CurrentUser() user: any,
  ): Promise<SettlementResponseDto> {
    const settlement = await this.settlementService.retrySettlement(
      settlementId,
      user.id,
      user.role,
    );
    return this.mapToResponseDto(settlement);
  }

  @Post(":id/put-on-hold")
  @HttpCode(200)
  @RequirePermissions("settlements:trigger")
  @ApiOperation({ summary: "Put settlement on hold" })
  @ApiResponse({ status: 200, description: "Settlement put on hold" })
  async putSettlementOnHold(
    @Param("id") settlementId: string,
    @Body() dto: PutSettlementOnHoldDto,
    @CurrentUser() user: any,
  ): Promise<SettlementResponseDto> {
    const settlement = await this.settlementService.putSettlementOnHold(
      settlementId,
      dto,
      user.id,
      user.role,
    );
    return this.mapToResponseDto(settlement);
  }

  @Post("trigger")
  @HttpCode(201)
  @RequirePermissions("settlements:trigger")
  @ApiOperation({ summary: "Manually trigger settlement" })
  @ApiResponse({
    status: 201,
    description: "Settlement triggered successfully",
  })
  async triggerSettlement(
    @Body() dto: TriggerSettlementDto,
    @CurrentUser() user: any,
  ): Promise<SettlementResponseDto> {
    const settlement = await this.settlementService.triggerSettlement(
      dto,
      user.id,
      user.role,
    );
    return this.mapToResponseDto(settlement);
  }

  private mapToResponseDto(settlement: Settlement): SettlementResponseDto {
    return {
      id: settlement.id,
      merchantId: settlement.merchantId,
      transactionIds: settlement.transactionIds,
      grossAmountUsd: settlement.grossAmountUsd,
      totalFeesUsd: settlement.totalFeesUsd,
      netAmountFiat: settlement.netAmountFiat,
      settlementCurrency: settlement.settlementCurrency,
      exchangeRateUsed: settlement.exchangeRateUsed,
      status: settlement.status,
      bankTransferReference: settlement.bankTransferReference,
      liquidityProviderRef: settlement.liquidityProviderRef,
      failureReason: settlement.failureReason,
      processingStartedAt: settlement.processingStartedAt,
      completedAt: settlement.completedAt,
      transactionCount: settlement.transactionCount,
      createdAt: settlement.createdAt,
      updatedAt: settlement.updatedAt,
    };
  }
}
