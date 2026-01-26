import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  Version,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiHeader,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import { SettlementService } from '../services/settlement.service';
import {
  CreateSettlementDto,
  UpdateSettlementDto,
  SettlementResponseDto,
} from '../dto/settlement.dto';
import { ErrorResponseDto, SuccessResponseDto } from '../../common/dto/common-response.dto';

@ApiTags('Settlements')
@ApiBearerAuth('JWT-auth')
@Controller('settlements')
export class SettlementController {
  constructor(private readonly settlementService: SettlementService) {}

  @Version('1')
  @Post()
  @ApiOperation({
    summary: 'Create a new settlement',
    description: 'Creates a new settlement record with the provided details',
    operationId: 'createSettlementV1',
  })
  @ApiHeader({
    name: 'X-Request-ID',
    description: 'Optional request identifier for tracking',
    required: false,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Settlement created successfully',
    schema: {
      example: {
        data: {
          id: 'SETTLE-2024-001',
          amount: 1000.50,
          currency: 'USD',
          status: 'PENDING',
          createdAt: '2024-01-20T10:30:00Z',
          updatedAt: '2024-01-20T10:30:00Z',
        },
        requestId: 'req-123456-789',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid request body',
    schema: {
      example: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        requestId: 'req-123456-789',
        timestamp: '2024-01-20T10:30:00Z',
        details: {
          amount: 'must be a positive number',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  async create(
    @Body() createSettlementDto: CreateSettlementDto,
  ): Promise<SuccessResponseDto<SettlementResponseDto>> {
    const result = await this.settlementService.create(createSettlementDto);
    return {
      data: result,
      requestId: 'req-123456-789',
    };
  }

  @Version('1')
  @Get()
  @ApiOperation({
    summary: 'Retrieve all settlements',
    description: 'Fetches a paginated list of settlements with optional filtering',
    operationId: 'getSettlementsV1',
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number for pagination',
    required: false,
    example: 1,
    type: 'number',
  })
  @ApiQuery({
    name: 'limit',
    description: 'Items per page',
    required: false,
    example: 20,
    type: 'number',
  })
  @ApiQuery({
    name: 'status',
    description: 'Filter by settlement status',
    required: false,
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
  })
  @ApiQuery({
    name: 'currency',
    description: 'Filter by currency',
    required: false,
    example: 'USD',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Settlements retrieved successfully',
    schema: {
      example: {
        data: [
          {
            id: 'SETTLE-2024-001',
            amount: 1000.50,
            currency: 'USD',
            status: 'COMPLETED',
            createdAt: '2024-01-20T10:30:00Z',
            updatedAt: '2024-01-20T12:00:00Z',
            completedAt: '2024-01-20T12:00:00Z',
          },
        ],
        meta: {
          page: 1,
          limit: 20,
          total: 100,
          totalPages: 5,
        },
        requestId: 'req-123456-789',
      },
    },
  })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('status') status?: string,
    @Query('currency') currency?: string,
  ) {
    return this.settlementService.findAll({ page, limit, status, currency });
  }

  @Version('1')
  @Get(':id')
  @ApiOperation({
    summary: 'Retrieve a specific settlement',
    description: 'Fetches details of a settlement by its unique identifier',
    operationId: 'getSettlementByIdV1',
  })
  @ApiParam({
    name: 'id',
    description: 'Settlement unique identifier',
    example: 'SETTLE-2024-001',
    type: 'string',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Settlement found and returned',
    type: SettlementResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Settlement not found',
  })
  async findOne(@Param('id') id: string): Promise<SuccessResponseDto<SettlementResponseDto>> {
    const result = await this.settlementService.findOne(id);
    return {
      data: result,
      requestId: 'req-123456-789',
    };
  }

  @Version('1')
  @Put(':id')
  @ApiOperation({
    summary: 'Update a settlement',
    description: 'Updates specific fields of an existing settlement',
    operationId: 'updateSettlementV1',
  })
  @ApiParam({
    name: 'id',
    description: 'Settlement unique identifier',
    example: 'SETTLE-2024-001',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Settlement updated successfully',
    type: SettlementResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Settlement not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid update data',
  })
  async update(
    @Param('id') id: string,
    @Body() updateSettlementDto: UpdateSettlementDto,
  ): Promise<SuccessResponseDto<SettlementResponseDto>> {
    const result = await this.settlementService.update(id, updateSettlementDto);
    return {
      data: result,
      requestId: 'req-123456-789',
    };
  }

  @Version('1')
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a settlement',
    description: 'Permanently deletes a settlement record',
    operationId: 'deleteSettlementV1',
  })
  @ApiParam({
    name: 'id',
    description: 'Settlement unique identifier',
    example: 'SETTLE-2024-001',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Settlement deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Settlement not found',
  })
  async delete(@Param('id') id: string): Promise<void> {
    await this.settlementService.delete(id);
  }
}
