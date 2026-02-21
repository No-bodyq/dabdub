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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { WebhookService } from '../services/webhook.service';
import { WebhookDeliveryService } from '../services/webhook-delivery.service';
import {
  CreateWebhookDto,
  WebhookResponseDto,
  WebhookTestRequestDto,
  WebhookVerificationRequestDto,
} from '../dto/webhook.dto';
import { SuccessResponseDto } from '../../common/dto/common-response.dto';

@ApiTags('Webhooks')
@ApiBearerAuth('JWT-auth')
@Controller('webhooks')
export class WebhookController {
  constructor(
    private readonly webhookService: WebhookService,
    private readonly webhookDeliveryService: WebhookDeliveryService,
  ) {}

  @Version('1')
  @Post()
  @ApiOperation({
    summary: 'Create a webhook subscription',
    description:
      'Registers a new webhook endpoint for receiving settlement events',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Webhook created successfully',
    type: WebhookResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid webhook configuration',
  })
  async create(
    @Body() createWebhookDto: CreateWebhookDto,
  ): Promise<SuccessResponseDto<WebhookResponseDto>> {
    const result = await this.webhookService.create(createWebhookDto);
    return {
      data: result,
      requestId: 'req-123456-789',
    };
  }

  @Version('1')
  @Get()
  @ApiOperation({
    summary: 'List all webhooks',
    description: 'Retrieves all configured webhook subscriptions',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Webhooks list retrieved',
    isArray: true,
    type: WebhookResponseDto,
  })
  async findAll() {
    return this.webhookService.findAll();
  }

  @Version('1')
  @Get(':id')
  @ApiParam({
    name: 'id',
    description: 'Webhook unique identifier',
  })
  @ApiOperation({
    summary: 'Get webhook details',
  })
  async findOne(@Param('id') id: string) {
    return this.webhookService.findOne(id);
  }

  @Version('1')
  @Put(':id')
  @ApiParam({
    name: 'id',
    description: 'Webhook unique identifier',
  })
  @ApiOperation({
    summary: 'Update webhook configuration',
  })
  async update(
    @Param('id') id: string,
    @Body() updateWebhookDto: CreateWebhookDto,
  ) {
    return this.webhookService.update(id, updateWebhookDto);
  }

  @Version('1')
  @Delete(':id')
  @ApiParam({
    name: 'id',
    description: 'Webhook unique identifier',
  })
  @ApiOperation({
    summary: 'Delete webhook subscription',
  })
  async delete(@Param('id') id: string): Promise<void> {
    await this.webhookService.delete(id);
  }

  @Version('1')
  @Post(':id/test')
  @ApiParam({
    name: 'id',
    description: 'Webhook unique identifier',
  })
  @ApiOperation({
    summary: 'Send a test webhook event',
  })
  async testWebhook(
    @Param('id') id: string,
    @Body() body: WebhookTestRequestDto,
  ): Promise<void> {
    await this.webhookDeliveryService.enqueueDelivery(
      id,
      'webhook.test',
      body?.payload ?? {},
      {},
    );
  }

  @Version('1')
  @Post(':id/replay/:deliveryLogId')
  @ApiParam({
    name: 'id',
    description: 'Webhook unique identifier',
  })
  @ApiParam({
    name: 'deliveryLogId',
    description: 'Delivery log identifier to replay',
  })
  @ApiOperation({
    summary: 'Replay a previous webhook delivery',
  })
  async replayWebhook(
    @Param('deliveryLogId') deliveryLogId: string,
  ): Promise<void> {
    await this.webhookDeliveryService.replayDelivery(deliveryLogId);
  }

  @Version('1')
  @Post(':id/verify')
  @ApiOperation({
    summary: 'Verify a webhook signature',
  })
  async verifyWebhookSignature(
    @Param('id') id: string,
    @Body() body: WebhookVerificationRequestDto,
  ): Promise<{ valid: boolean }> {
    const webhook = await this.webhookService.findOne(id);
    const payloadString =
      this.webhookDeliveryService.serializePayloadForVerification(
        body.payload ?? {},
      );
    const valid = this.webhookDeliveryService.verifySignature(
      payloadString,
      webhook.secret,
      body.signature,
    );
    return { valid };
  }

  @Version('1')
  @Get(':id/analytics')
  @ApiOperation({
    summary: 'Get webhook delivery analytics',
  })
  async analytics(
    @Param('id') id: string,
    @Query('from') _from?: string,
    @Query('to') _to?: string,
  ) {
    return this.webhookService.getDeliveryAnalytics(id);
  }
}
