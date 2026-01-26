import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpStatus,
  Version,
  ApiBearerAuth,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { WebhookService } from '../services/webhook.service';
import { CreateWebhookDto, WebhookResponseDto } from '../dto/webhook.dto';
import { SuccessResponseDto } from '../../common/dto/common-response.dto';

@ApiTags('Webhooks')
@ApiBearerAuth('JWT-auth')
@Controller('webhooks')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Version('1')
  @Post()
  @ApiOperation({
    summary: 'Create a webhook subscription',
    description: 'Registers a new webhook endpoint for receiving settlement events',
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
}
