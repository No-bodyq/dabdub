import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus } from '../database/entities/payment.entity';
import * as QRCode from 'qrcode';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  async getPaymentDetails(id: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({ where: { id } });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    return payment;
  }

  async getPaymentStatus(id: string): Promise<{ status: PaymentStatus }> {
    const payment = await this.getPaymentDetails(id);
    return { status: payment.status };
  }

  async generateQR(id: string): Promise<Buffer> {
    const payment = await this.getPaymentDetails(id);
    const url = `https://example.com/payment/${id}`;
    return QRCode.toBuffer(url);
  }

  async handleNotify(id: string, data: any): Promise<void> {
    const payment = await this.getPaymentDetails(id);
    if (data.status) {
      payment.status = data.status;
      await this.paymentRepository.save(payment);
    }
  }

  getNetworks(): string[] {
    return ['ethereum', 'polygon', 'bsc'];
  }

  getExchangeRates(): Record<string, number> {
    return {
      'ETH/USD': 3000,
      'MATIC/USD': 1.5,
      'BNB/USD': 400,
    };
  }
}