import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionQueryDto } from './dto/transaction-query.dto';
import { TransactionDetailResponseDto } from './dto/transaction-detail.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { Response } from 'express';
import { Readable } from 'stream';

@ApiTags('Transactions')
@Controller('api/v1/transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) { }

  @Get()
  @ApiOperation({ summary: 'List all transactions with advanced filtering' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Return list of transactions.' })
  async findAll(@Query() query: TransactionQueryDto) {
    return this.transactionsService.findAll(query);
  }

  @Get('export')
  @ApiOperation({ summary: 'Export transactions to CSV or PDF' })
  @ApiQuery({ name: 'format', enum: ['csv', 'pdf'], required: true })
  async export(
    @Query() query: TransactionQueryDto,
    @Query('format') format: 'csv' | 'pdf',
    @Res() res: Response,
  ) {
    const data = await this.transactionsService.export(query, format);

    if (format === 'csv') {
      res.set({
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="transactions.csv"',
      });
      (data as Readable).pipe(res);
    } else {
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="transactions.pdf"',
        'Content-Length': (data as Buffer).length,
      });
      res.end(data);
    }
  }

  @Get('hash/:txHash')
  @ApiOperation({ summary: 'Lookup transaction by hash' })
  async findByHash(@Param('txHash') txHash: string) {
    return this.transactionsService.findByHash(txHash);
  }

  @Get('network/:network')
  @ApiOperation({ summary: 'List transactions for a specific network' })
  async findByNetwork(
    @Param('network') network: string,
    @Query() query: TransactionQueryDto,
  ) {
    query.network = network;
    return this.transactionsService.findAll(query);
  }

  // --- Parameterised routes MUST be after all literal routes to avoid shadowing ---

  @Get(':id')
  @ApiOperation({ summary: 'Get full transaction detail' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: TransactionDetailResponseDto,
    description: 'Full transaction detail including on-chain data, fees, settlement, and webhooks.',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Transaction not found.' })
  async getDetail(@Param('id') id: string): Promise<TransactionDetailResponseDto> {
    return this.transactionsService.getDetail(id);
  }

  @Get(':id/confirmations')
  @ApiOperation({ summary: 'Get real-time confirmation count' })
  async getConfirmations(@Param('id') id: string) {
    return this.transactionsService.getConfirmations(id);
  }
}
