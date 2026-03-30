import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApiKeyService } from './ApiKeyService';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiKey, ApiPermission } from './entities/ApiKey';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

class CreateApiKeyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @IsArray()
  @IsEnum(ApiPermission, { each: true })
  permissions: ApiPermission[];

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsEnum(['live', 'test'], { message: 'mode must be live or test' })
  mode?: 'live' | 'test';
}

@ApiTags('merchant-api-keys')
@Controller({ path: 'merchant/api-keys', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @Post()
  @ApiOperation({ summary: 'Create API key for merchant' })
  @ApiResponse({ status: 201, schema: { properties: { key: { type: 'string' } } } })
  async create(@Req() req: any, @Body() dto: CreateApiKeyDto) {
    const merchantId = req.user.id;
    const key = await this.apiKeyService.create(merchantId, {
      name: dto.name,
      permissions: dto.permissions,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      mode: dto.mode ?? 'live',
    });

    return { key };
  }

  @Get()
  @ApiOperation({ summary: 'List merchant API keys (no full key)' })
  async list(@Req() req: any): Promise<Partial<ApiKey>[]> {
    return this.apiKeyService.list(req.user.id);
  }

  @Patch(':id/rotate')
  @ApiOperation({ summary: 'Rotate a merchant API key' })
  @ApiResponse({ status: 200, schema: { properties: { key: { type: 'string' } } } })
  async rotate(@Req() req: any, @Param('id') id: string) {
    const key = await this.apiKeyService.rotate(id, req.user.id);
    return { key };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke merchant API key' })
  async revoke(@Req() req: any, @Param('id') id: string) {
    await this.apiKeyService.revoke(id, req.user.id);
  }
}
