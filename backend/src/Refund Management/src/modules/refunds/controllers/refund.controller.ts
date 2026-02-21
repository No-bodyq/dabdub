import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  UseGuards,
  Inject,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { RefundService } from "../services/refund.service";
import {
  InitiateRefundDto,
  RefundResponseDto,
  RefundListResponseDto,
} from "../dtos/refund.dto";
import { RequirePermissions, CurrentUser } from "../../../common/decorators";
import { Refund } from "../entities/refund.entity";

@ApiTags("Refunds")
@Controller("api/v1/transactions")
export class RefundController {
  constructor(private refundService: RefundService) {}

  @Post(":id/refund")
  @HttpCode(201)
  @RequirePermissions("transactions:refund")
  @ApiOperation({ summary: "Initiate refund for a transaction" })
  @ApiResponse({ status: 201, description: "Refund initiated successfully" })
  async initiateRefund(
    @Param("id") transactionId: string,
    @Body() dto: InitiateRefundDto,
    @CurrentUser() user: any,
  ): Promise<RefundResponseDto> {
    const refund = await this.refundService.initiateRefund(
      transactionId,
      dto,
      user.id,
      user.role,
    );
    return this.mapToResponseDto(refund);
  }

  private mapToResponseDto(refund: Refund): RefundResponseDto {
    return {
      id: refund.id,
      transactionId: refund.transactionId,
      merchantId: refund.merchantId,
      refundAmountUsd: refund.refundAmountUsd,
      refundAmountToken: refund.refundAmountToken,
      method: refund.method,
      status: refund.status,
      reason: refund.reason,
      internalNote: refund.internalNote,
      onChainTxHash: refund.onChainTxHash,
      completedAt: refund.completedAt,
      failureReason: refund.failureReason,
      retryCount: refund.retryCount,
      createdAt: refund.createdAt,
      updatedAt: refund.updatedAt,
    };
  }
}

@ApiTags("Refunds")
@Controller("api/v1/refunds")
export class RefundListController {
  constructor(private refundService: RefundService) {}

  @Get()
  @RequirePermissions("transactions:read")
  @ApiOperation({ summary: "List refunds with filters" })
  @ApiResponse({ status: 200, description: "Refunds retrieved successfully" })
  async listRefunds(
    @Query("merchantId") merchantId?: string,
    @Query("status") status?: string,
    @Query("method") method?: string,
    @Query("reason") reason?: string,
    @Query("createdAfter") createdAfter?: string,
    @Query("createdBefore") createdBefore?: string,
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 20,
  ): Promise<RefundListResponseDto> {
    const filters: any = {
      ...(merchantId && { merchantId }),
      ...(status && { status }),
      ...(method && { method }),
      ...(reason && { reason }),
      ...(createdAfter && { createdAfter: new Date(createdAfter) }),
      ...(createdBefore && { createdBefore: new Date(createdBefore) }),
    };

    const result = await this.refundService.listRefunds(
      filters,
      Number(page),
      Number(limit),
    );

    return {
      data: result.data.map((r) => this.mapToResponseDto(r)),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  @Get(":id")
  @RequirePermissions("transactions:read")
  @ApiOperation({ summary: "Get refund detail" })
  @ApiResponse({ status: 200, description: "Refund retrieved successfully" })
  async getRefund(@Param("id") refundId: string): Promise<RefundResponseDto> {
    const refund = await this.refundService.getRefund(refundId);
    return this.mapToResponseDto(refund);
  }

  @Post(":id/retry")
  @HttpCode(200)
  @RequirePermissions("transactions:refund")
  @ApiOperation({ summary: "Retry failed refund" })
  @ApiResponse({ status: 200, description: "Refund retry initiated" })
  async retryRefund(
    @Param("id") refundId: string,
    @CurrentUser() user: any,
  ): Promise<RefundResponseDto> {
    const refund = await this.refundService.retryRefund(
      refundId,
      user.id,
      user.role,
    );
    return this.mapToResponseDto(refund);
  }

  private mapToResponseDto(refund: Refund): RefundResponseDto {
    return {
      id: refund.id,
      transactionId: refund.transactionId,
      merchantId: refund.merchantId,
      refundAmountUsd: refund.refundAmountUsd,
      refundAmountToken: refund.refundAmountToken,
      method: refund.method,
      status: refund.status,
      reason: refund.reason,
      internalNote: refund.internalNote,
      onChainTxHash: refund.onChainTxHash,
      completedAt: refund.completedAt,
      failureReason: refund.failureReason,
      retryCount: refund.retryCount,
      createdAt: refund.createdAt,
      updatedAt: refund.updatedAt,
    };
  }
}
