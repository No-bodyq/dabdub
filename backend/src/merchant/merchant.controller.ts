import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MerchantService } from './services/merchant.service';
import {
  RegisterMerchantDto,
  UpdateProfileDto,
  BankDetailsDto,
  MerchantResponseDto,
} from './dto/merchant.dto';

/**
 * Controller for merchant registration and management
 */
@ApiTags('Merchants')
@Controller('merchants')
export class MerchantController {
  constructor(private readonly merchantService: MerchantService) {}

  /**
   * Register a new merchant
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new merchant' })
  @ApiResponse({ status: 201, description: 'Merchant registered successfully' })
  async register(@Body() dto: RegisterMerchantDto): Promise<any> {
    // TODO: Implement merchant registration
    return { message: 'Not implemented' };
  }

  /**
   * Get merchant by ID
   */
  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get merchant by ID' })
  @ApiResponse({ status: 200, description: 'Merchant found' })
  @ApiResponse({ status: 404, description: 'Merchant not found' })
  async getMerchant(@Param('id') id: string): Promise<any> {
    // TODO: Implement get merchant
    return { message: 'Not implemented' };
  }

  /**
   * Update merchant profile
   */
  @Put(':id/profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update merchant profile' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  async updateProfile(
    @Param('id') id: string,
    @Body() dto: UpdateProfileDto,
  ): Promise<any> {
    // TODO: Implement profile update
    return { message: 'Not implemented' };
  }

  /**
   * Update bank details
   */
  @Put(':id/bank-details')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update bank details' })
  @ApiResponse({ status: 200, description: 'Bank details updated' })
  async updateBankDetails(
    @Param('id') id: string,
    @Body() dto: BankDetailsDto,
  ): Promise<any> {
    // TODO: Implement bank details update
    return { message: 'Not implemented' };
  }
}
