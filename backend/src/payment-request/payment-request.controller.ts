import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PaymentRequestService } from './payment-request.service';
import { CreatePaymentRequestDto } from './dto/create-payment-request.dto';
import { UpdatePaymentRequestDto } from './dto/update-payment-request.dto';
import {
  SearchPaymentRequestDto,
  StatsRangeDto,
} from './dto/search-payment-request.dto';

@ApiTags('Payment Requests')
@Controller('payment-requests')
export class PaymentRequestController {
  constructor(private readonly paymentRequestService: PaymentRequestService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new payment request' })
  @ApiResponse({ status: 201, description: 'Payment request created.' })
  async create(@Body() dto: CreatePaymentRequestDto) {
    return this.paymentRequestService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Search payment requests' })
  @ApiResponse({ status: 200, description: 'Paginated payment requests.' })
  async search(@Query() dto: SearchPaymentRequestDto) {
    return this.paymentRequestService.search(dto);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get payment request statistics' })
  @ApiResponse({ status: 200, description: 'Payment request stats.' })
  async getStats(@Query('merchantId') merchantId?: string) {
    return this.paymentRequestService.getStats(merchantId);
  }

  @Get('stats/range')
  @ApiOperation({ summary: 'Get stats by date range' })
  @ApiResponse({ status: 200, description: 'Stats within date range.' })
  async getStatsRange(@Query() dto: StatsRangeDto) {
    return this.paymentRequestService.getStatsRange(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment request by ID' })
  @ApiResponse({ status: 200, description: 'Payment request details.' })
  @ApiResponse({ status: 404, description: 'Payment request not found.' })
  async findById(@Param('id') id: string) {
    return this.paymentRequestService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a pending payment request' })
  @ApiResponse({ status: 200, description: 'Payment request updated.' })
  async update(@Param('id') id: string, @Body() dto: UpdatePaymentRequestDto) {
    return this.paymentRequestService.update(id, dto);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a payment request' })
  @ApiResponse({ status: 200, description: 'Payment request cancelled.' })
  async cancel(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.paymentRequestService.cancel(id, reason);
  }

  @Post(':id/process')
  @ApiOperation({ summary: 'Trigger on-chain processing' })
  @ApiResponse({
    status: 200,
    description: 'Payment request processing started.',
  })
  async process(@Param('id') id: string) {
    return this.paymentRequestService.process(id);
  }

  @Post(':id/refund')
  @ApiOperation({ summary: 'Refund a completed payment request' })
  @ApiResponse({ status: 200, description: 'Payment request refunded.' })
  async refund(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.paymentRequestService.refund(id, reason);
  }

  @Get(':id/qr')
  @ApiOperation({ summary: 'Get QR code for payment request' })
  @ApiResponse({ status: 200, description: 'QR code data.' })
  async getQrCode(@Param('id') id: string) {
    return this.paymentRequestService.getQrCode(id);
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Get payment request status and history' })
  @ApiResponse({ status: 200, description: 'Status and history.' })
  async getStatus(@Param('id') id: string) {
    return this.paymentRequestService.getStatus(id);
  }
}
