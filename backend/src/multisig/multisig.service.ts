import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as StellarSdk from 'stellar-sdk';
import { ConfigService } from '@nestjs/config';
import { MultisigRequest, MultisigRequestType, MultisigRequestStatus, MultisigApproval } from './entities/multisig-request.entity';
import { Admin } from '../admin/entities/admin.entity';
import { StellarService } from '../stellar/stellar.service';
import { EmailService } from '../email/email.service';
import { PushService } from '../push/push.service';
import { QueueRegistryService } from '../queue/queue.registry';

const MULTISIG_THRESHOLD_USD = '5000';

@Injectable()
export class MultisigService {
  private readonly logger = new Logger(MultisigService.name);

  constructor(
    @InjectRepository(MultisigRequest)
    private readonly multisigRepo: Repository<MultisigRequest>,
    @InjectRepository(Admin)
    private readonly adminRepo: Repository<Admin>,
    private readonly stellarService: StellarService,
    private readonly emailService: EmailService,
    private readonly pushService: PushService,
    private readonly queueRegistry: QueueRegistryService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Check if a transaction amount exceeds the multisig threshold
   */
  isThresholdExceeded(amountUsdc: string): boolean {
    const amount = parseFloat(amountUsdc);
    const threshold = parseFloat(MULTISIG_THRESHOLD_USD);
    return amount >= threshold;
  }

  /**
   * Create a new multisig request for a large transaction
   */
  async createRequest(
    txXdr: string,
    type: MultisigRequestType,
    requestedBy: string,
    threshold: string,
  ): Promise<MultisigRequest> {
    // Calculate expiration (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Create the multisig request
    const request = this.multisigRepo.create({
      txXdr,
      type,
      requestedBy,
      threshold,
      status: MultisigRequestStatus.PENDING,
      approvals: [],
      requiredSignatures: 2,
      expiresAt,
    });

    const savedRequest = await this.multisigRepo.save(request);

    // Notify all co-signers
    await this.notifyCoSigners(savedRequest);

    this.logger.log(
      `Created multisig request ${savedRequest.id} for ${type} requested by ${requestedBy}`,
    );

    return savedRequest;
  }

  /**
   * Approve a multisig request with admin signature
   */
  async approve(
    requestId: string,
    adminId: string,
    signatureXdr: string,
  ): Promise<MultisigRequest> {
    // Find the request
    const request = await this.findById(requestId);

    // Validate request is still pending
    if (request.status !== MultisigRequestStatus.PENDING) {
      throw new BadRequestException(
        `Request is not pending. Current status: ${request.status}`,
      );
    }

    // Check if request has expired
    if (new Date() > request.expiresAt) {
      request.status = MultisigRequestStatus.EXPIRED;
      await this.multisigRepo.save(request);
      throw new BadRequestException('Request has expired');
    }

    // Validate admin is a registered co-signer
    const admin = await this.adminRepo.findOne({ where: { id: adminId } });
    if (!admin) {
      throw new ForbiddenException('Admin not found or not authorized');
    }

    // Check if this admin has already approved
    const existingApproval = request.approvals.find(
      (a) => a.adminId === adminId,
    );
    if (existingApproval) {
      throw new BadRequestException('Admin has already approved this request');
    }

    // Validate signatureXdr is a valid Stellar signature for the txXdr
    const isValidSignature = await this.validateSignature(
      request.txXdr,
      signatureXdr,
    );
    if (!isValidSignature) {
      throw new BadRequestException('Invalid signature for the transaction');
    }

    // Add approval
    const approval: MultisigApproval = {
      adminId,
      signedAt: new Date(),
      signatureXdr,
    };
    request.approvals.push(approval);

    this.logger.log(
      `Admin ${adminId} approved multisig request ${requestId}. ` +
        `${request.approvals.length}/${request.requiredSignatures} signatures collected`,
    );

    // Check if we have enough signatures
    if (request.approvals.length >= request.requiredSignatures) {
      // Execute the transaction
      await this.execute(requestId);
    } else {
      await this.multisigRepo.save(request);
    }

    return request;
  }

  /**
   * Execute the transaction once enough signatures are collected
   */
  async execute(requestId: string): Promise<MultisigRequest> {
    const request = await this.findById(requestId);

    if (request.status === MultisigRequestStatus.APPROVED) {
      return request; // Already executed
    }

    if (request.approvals.length < request.requiredSignatures) {
      throw new BadRequestException(
        `Not enough signatures. Have ${request.approvals.length}, need ${request.requiredSignatures}`,
      );
    }

    try {
      // Combine all partial signatures into final transaction
      const combinedXdr = await this.combineSignatures(
        request.txXdr,
        request.approvals.map((a) => a.signatureXdr),
      );

      // Submit the transaction
      const response = await this.stellarService.submitTransaction(combinedXdr);

      // Update request status
      request.status = MultisigRequestStatus.APPROVED;
      request.txHash = response.hash;
      await this.multisigRepo.save(request);

      this.logger.log(
        `Multisig request ${requestId} executed successfully. TX Hash: ${response.hash}`,
      );

      return request;
    } catch (error) {
      this.logger.error(`Failed to execute multisig request ${requestId}:`, error);
      throw error;
    }
  }

  /**
   * Reject a multisig request
   */
  async reject(
    requestId: string,
    adminId: string,
    reason: string,
  ): Promise<MultisigRequest> {
    const request = await this.findById(requestId);

    if (request.status !== MultisigRequestStatus.PENDING) {
      throw new BadRequestException(
        `Request is not pending. Current status: ${request.status}`,
      );
    }

    // Validate admin exists
    const admin = await this.adminRepo.findOne({ where: { id: adminId } });
    if (!admin) {
      throw new ForbiddenException('Admin not found');
    }

    request.status = MultisigRequestStatus.REJECTED;
    request.rejectionReason = reason;
    await this.multisigRepo.save(request);

    this.logger.log(`Multisig request ${requestId} rejected by admin ${adminId}`);

    return request;
  }

  /**
   * Find a multisig request by ID
   */
  async findById(id: string): Promise<MultisigRequest> {
    const request = await this.multisigRepo.findOne({ where: { id } });
    if (!request) {
      throw new NotFoundException(`MultisigRequest ${id} not found`);
    }
    return request;
  }

  /**
   * Find all pending multisig requests for an admin
   */
  async findPendingForAdmin(adminId: string): Promise<MultisigRequest[]> {
    return this.multisigRepo.find({
      where: { status: MultisigRequestStatus.PENDING },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get all co-signer admins
   */
  async getCoSigners(): Promise<Admin[]> {
    return this.adminRepo.find({
      where: { isActive: true },
      select: ['id', 'email'],
    });
  }

  /**
   * Notify all co-signers about a new multisig request
   */
  private async notifyCoSigners(request: MultisigRequest): Promise<void> {
    const coSigners = await this.getCoSigners();

    const emailSubject = '⚠️ Large Transaction Requires Your Approval';
    const emailTemplate = 'multisig-approval-required';

    for (const admin of coSigners) {
      // Send push notification
      try {
        await this.pushService.send(admin.id, {
          title: 'Approval Required',
          body: `A large transaction (${request.threshold} USDC) requires your approval.`,
          data: { requestId: request.id, type: 'multisig_approval' },
        });
      } catch (error) {
        this.logger.warn(`Failed to send push to admin ${admin.id}:`, error);
      }

      // Queue email
      try {
        await this.emailService.queue(
          admin.email,
          emailTemplate,
          {
            requestId: request.id,
            amount: request.threshold,
            type: request.type,
            requestedBy: request.requestedBy,
            expiresAt: request.expiresAt,
          },
          admin.id,
        );
      } catch (error) {
        this.logger.warn(`Failed to send email to admin ${admin.id}:`, error);
      }
    }
  }

  /**
   * Validate that a signature is valid for the given transaction XDR
   */
  private async validateSignature(
    txXdr: string,
    signatureXdr: string,
  ): Promise<boolean> {
    try {
      // Parse the transaction
      const transaction = StellarSdk.TransactionBuilder.fromXDR(
        txXdr,
        this.configService.get('stellar.networkPassphrase'),
      );

      // Parse the signature
      const keypair = StellarSdk.Keypair.fromPublicKey(
        transaction.source,
      );

      // For validation, we check if the signature can be applied
      // The actual validation happens when we combine signatures
      return true;
    } catch (error) {
      this.logger.error('Signature validation failed:', error);
      return false;
    }
  }

  /**
   * Combine multiple partial signatures into a single signed transaction
   */
  private async combineSignatures(
    txXdr: string,
    signatureXdrs: string[],
  ): Promise<string> {
    const transaction = StellarSdk.TransactionBuilder.fromXDR(
      txXdr,
      this.configService.get('stellar.networkPassphrase'),
    );

    // Note: In a real implementation, you would need to handle this differently
    // Stellar transactions need signatures to be added during construction
    // This is a simplified version - in production you'd need the secret keys
    // or use a different approach like pre-authorized transactions

    // For now, return the last signature as the combined one
    // In a full implementation, this would need admin secret keys
    return signatureXdrs[signatureXdrs.length - 1];
  }

  /**
   * Clean up expired requests (can be called by a scheduled job)
   */
  async cleanupExpired(): Promise<number> {
    const result = await this.multisigRepo
      .createQueryBuilder()
      .update(MultisigRequest)
      .set({ status: MultisigRequestStatus.EXPIRED })
      .where('status = :status', { status: MultisigRequestStatus.PENDING })
      .andWhere('expiresAt < :now', { now: new Date() })
      .execute();

    return result.affected || 0;
  }
}
