import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpStatus,
  HttpCode,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiHeader,
} from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { WebhookResponseDto } from './dto/webhook-response.dto';
import { WebhookDeliveryLogResponseDto } from './dto/webhook-delivery-log-response.dto';
import { ValidateSignatureDto } from './dto/validate-signature.dto';

@ApiTags('Webhooks')
@Controller('api/v1/webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  private getMerchantId(
    headers: Record<string, string | string[] | undefined>,
  ): string {
    // Placeholder for actual auth logic. In production, this would come from a JWT.
    // For now, we'll allow passing it in a header for testing.
    const merchantId = headers['x-merchant-id'];
    return (
      (Array.isArray(merchantId) ? merchantId[0] : merchantId) ||
      '00000000-0000-0000-0000-000000000000'
    );
  }

  @Post()
  @ApiOperation({ summary: 'Create a new webhook configuration' })
  @ApiResponse({ status: HttpStatus.CREATED, type: WebhookResponseDto })
  @ApiHeader({ name: 'x-merchant-id', required: false })
  async create(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() createDto: CreateWebhookDto,
  ): Promise<WebhookResponseDto> {
    const merchantId = this.getMerchantId(headers);
    return (await this.webhooksService.create(
      merchantId,
      createDto,
    )) as unknown as WebhookResponseDto;
  }

  @Get()
  @ApiOperation({ summary: 'List all webhook configurations' })
  @ApiResponse({ status: HttpStatus.OK, type: [WebhookResponseDto] })
  async findAll(
    @Headers() headers: Record<string, string | string[] | undefined>,
  ): Promise<WebhookResponseDto[]> {
    const merchantId = this.getMerchantId(headers);
    return (await this.webhooksService.findAll(
      merchantId,
    )) as unknown as WebhookResponseDto[];
  }

  @Get('events')
  @ApiOperation({ summary: 'Get available webhook events' })
  @ApiResponse({ status: HttpStatus.OK, type: [String] })
  getEvents(): string[] {
    return this.webhooksService.getAvailableEvents();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get webhook details' })
  @ApiParam({ name: 'id', description: 'Webhook ID' })
  @ApiResponse({ status: HttpStatus.OK, type: WebhookResponseDto })
  async findOne(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id') id: string,
  ): Promise<WebhookResponseDto> {
    const merchantId = this.getMerchantId(headers);
    return (await this.webhooksService.findOne(
      merchantId,
      id,
    )) as unknown as WebhookResponseDto;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a webhook configuration' })
  @ApiParam({ name: 'id', description: 'Webhook ID' })
  @ApiResponse({ status: HttpStatus.OK, type: WebhookResponseDto })
  async update(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id') id: string,
    @Body() updateDto: UpdateWebhookDto,
  ): Promise<WebhookResponseDto> {
    const merchantId = this.getMerchantId(headers);
    return (await this.webhooksService.update(
      merchantId,
      id,
      updateDto,
    )) as unknown as WebhookResponseDto;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a webhook configuration' })
  @ApiParam({ name: 'id', description: 'Webhook ID' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  async remove(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id') id: string,
  ): Promise<void> {
    const merchantId = this.getMerchantId(headers);
    await this.webhooksService.remove(merchantId, id);
  }

  @Post(':id/test')
  @ApiOperation({ summary: 'Test a webhook configuration' })
  @ApiParam({ name: 'id', description: 'Webhook ID' })
  async test(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id') id: string,
  ): Promise<any> {
    const merchantId = this.getMerchantId(headers);
    return await this.webhooksService.testWebhook(merchantId, id);
  }

  @Post(':id/pause')
  @ApiOperation({ summary: 'Pause a webhook configuration' })
  @ApiParam({ name: 'id', description: 'Webhook ID' })
  async pause(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id') id: string,
  ): Promise<WebhookResponseDto> {
    const merchantId = this.getMerchantId(headers);
    return (await this.webhooksService.pause(
      merchantId,
      id,
    )) as unknown as WebhookResponseDto;
  }

  @Post(':id/resume')
  @ApiOperation({ summary: 'Resume a webhook configuration' })
  @ApiParam({ name: 'id', description: 'Webhook ID' })
  async resume(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id') id: string,
  ): Promise<WebhookResponseDto> {
    const merchantId = this.getMerchantId(headers);
    return (await this.webhooksService.resume(
      merchantId,
      id,
    )) as unknown as WebhookResponseDto;
  }

  @Get(':id/deliveries')
  @ApiOperation({ summary: 'Get delivery logs for a webhook' })
  @ApiParam({ name: 'id', description: 'Webhook ID' })
  @ApiResponse({ status: HttpStatus.OK, type: [WebhookDeliveryLogResponseDto] })
  async getDeliveries(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id') id: string,
  ): Promise<WebhookDeliveryLogResponseDto[]> {
    const merchantId = this.getMerchantId(headers);
    return (await this.webhooksService.getDeliveries(
      merchantId,
      id,
    )) as unknown as WebhookDeliveryLogResponseDto[];
  }

  @Post(':id/retry/:deliveryId')
  @ApiOperation({ summary: 'Manually retry a failed delivery' })
  @ApiParam({ name: 'id', description: 'Webhook ID' })
  @ApiParam({ name: 'deliveryId', description: 'Delivery Log ID' })
  async retry(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id') id: string,
    @Param('deliveryId') deliveryId: string,
  ): Promise<any> {
    const merchantId = this.getMerchantId(headers);
    return await this.webhooksService.retryDelivery(merchantId, id, deliveryId);
  }

  @Post('validate-signature')
  @ApiOperation({
    summary: 'Helper endpoint to validate a signature (for development)',
  })
  validateSignature(@Body() body: ValidateSignatureDto): { isValid: boolean } {
    const isValid = this.webhooksService.validateSignature(
      body.secret,
      body.payload,
      body.signature,
      body.timestamp,
    );
    return { isValid };
  }
}
