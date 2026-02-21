import {
  Controller,
  Post,
  Body,
  Get,
  Put,
  UseGuards,
  Request,
  HttpStatus,
  Param,
  Patch,
  Query,
} from '@nestjs/common';

import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MerchantService } from '../services/merchant.service';
import { MerchantAuthGuard } from '../guards/merchant-auth.guard';
import {
  RegisterMerchantDto,
  LoginMerchantDto,
  UpdateProfileDto,
  BankDetailsDto,
  SettingsDto,
  KycDocumentsDto,
  MerchantResponseDto,
  MerchantDetailResponseDto,
  UpdateMerchantDto,
} from '../dto/merchant.dto';


@ApiTags('Merchant')
@Controller('api/v1/merchants')
export class MerchantController {
  constructor(private readonly merchantService: MerchantService) { }

  @Post('register')
  @ApiOperation({ summary: 'Register a new merchant' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Merchant successfully registered',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email already exists',
  })
  async register(@Body() dto: RegisterMerchantDto) {
    const merchant = await this.merchantService.register(dto);
    const { password, ...result } = merchant;
    return result;
  }

  @Post('login')
  @ApiOperation({ summary: 'Login merchant' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Login successful' })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials',
  })
  async login(@Body() dto: LoginMerchantDto) {
    return this.merchantService.login(dto);
  }

  @Post('refresh-token')
  @ApiOperation({ summary: 'Refresh access token' })
  async refreshToken(@Body('refreshToken') token: string) {
    return this.merchantService.refreshToken(token);
  }

  @Post('verify-email')
  @ApiOperation({ summary: 'Verify email address' })
  async verifyEmail(@Body('email') email: string, @Body('code') code: string) {
    return this.merchantService.verifyEmail(email, code);
  }

  @Get('profile')
  @UseGuards(MerchantAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get merchant profile' })
  @ApiResponse({ status: HttpStatus.OK, type: MerchantResponseDto })
  async getProfile(@Request() req: any) {
    const merchant = await this.merchantService.getProfile(req.user.id);
    const { password, ...result } = merchant;
    return result;
  }

  @Put('profile')
  @UseGuards(MerchantAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update merchant profile' })
  async updateProfile(@Request() req: any, @Body() dto: UpdateProfileDto) {
    const merchant = await this.merchantService.updateProfile(req.user.id, dto);
    const { password, ...result } = merchant;
    return result;
  }

  @Put('bank-details')
  @UseGuards(MerchantAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update bank details' })
  async updateBankDetails(@Request() req: any, @Body() dto: BankDetailsDto) {
    const merchant = await this.merchantService.updateBankDetails(
      req.user.id,
      dto,
    );
    const { password, ...result } = merchant;
    return result;
  }

  @Get('settings')
  @UseGuards(MerchantAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get merchant settings' })
  async getSettings(@Request() req: any) {
    const merchant = await this.merchantService.getProfile(req.user.id);
    return merchant.settings || {};
  }

  @Put('settings')
  @UseGuards(MerchantAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update merchant settings' })
  async updateSettings(@Request() req: any, @Body() dto: SettingsDto) {
    const merchant = await this.merchantService.updateSettings(
      req.user.id,
      dto,
    );
    const { password, ...result } = merchant;
    return result;
  }

  @Post('upload-kyc-documents')
  @UseGuards(MerchantAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload KYC documents details (URLs)' })
  async uploadKycDocuments(@Request() req: any, @Body() dto: KycDocumentsDto) {
    const merchant = await this.merchantService.uploadKycDocuments(
      req.user.id,
      dto,
    );
    const { password, ...result } = merchant;
    return result;
  }

  @Get('kyc-status')
  @UseGuards(MerchantAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get KYC status' })
  async getKycStatus(@Request() req: any) {
    return this.merchantService.getKycStatus(req.user.id);
  }

  @Get('statistics')
  @UseGuards(MerchantAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get merchant statistics' })
  async getStatistics(@Request() req: any) {
    return this.merchantService.getStatistics(req.user.id);
  }

  // ---- Parameterized routes MUST be after all literal routes to avoid shadowing ----

  @Get(':id')
  @UseGuards(MerchantAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get merchant detail by ID' })
  @ApiResponse({ status: HttpStatus.OK, type: MerchantDetailResponseDto })
  async getDetail(@Request() req: any, @Param('id') id: string) {
    return this.merchantService.getDetail(id);
  }

  @Patch(':id')
  @UseGuards(MerchantAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update merchant settings' })
  @ApiResponse({ status: HttpStatus.OK, type: MerchantDetailResponseDto })
  async updateMerchant(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateMerchantDto,
  ) {
    return this.merchantService.updateMerchant(id, dto, req.user.id);
  }

  @Get(':id/history')
  @UseGuards(MerchantAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get merchant change history' })
  async getHistory(
    @Param('id') id: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.merchantService.getHistory(id, page, limit);
  }
}

