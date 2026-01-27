import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SettlementEntity } from '../../database/entities/settlement.entity';
import { CreateSettlementDto, UpdateSettlementDto } from '../dto/settlement.dto';

@Injectable()
export class SettlementService {
  constructor(
    @InjectRepository(SettlementEntity)
    private readonly settlementRepository: Repository<SettlementEntity>,
  ) {}

  async create(createSettlementDto: CreateSettlementDto): Promise<SettlementEntity> {
    const settlement = this.settlementRepository.create({
      ...createSettlementDto,
      status: createSettlementDto.status || 'PENDING',
    });

    return this.settlementRepository.save(settlement);
  }

  async findAll(filters: any): Promise<any> {
    const { page = 1, limit = 20, status, currency } = filters;
    const skip = (page - 1) * limit;

    const query = this.settlementRepository.createQueryBuilder('settlement');

    if (status) {
      query.where('settlement.status = :status', { status });
    }

    if (currency) {
      query.andWhere('settlement.currency = :currency', { currency });
    }

    const [data, total] = await query
      .skip(skip)
      .take(limit)
      .orderBy('settlement.createdAt', 'DESC')
      .getManyAndCount();

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<SettlementEntity> {
    const settlement = await this.settlementRepository.findOne({ where: { id } });
    if (!settlement) {
      throw new NotFoundException(`Settlement ${id} not found`);
    }
    return settlement;
  }

  async update(id: string, updateSettlementDto: UpdateSettlementDto): Promise<SettlementEntity> {
    await this.findOne(id); // Verify settlement exists

    await this.settlementRepository.update({ id }, {
      ...updateSettlementDto,
      updatedAt: new Date(),
    });

    return this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    const settlement = await this.findOne(id);
    await this.settlementRepository.remove(settlement);
  }
}
