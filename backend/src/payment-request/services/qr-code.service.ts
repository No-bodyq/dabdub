import { Injectable, Logger } from '@nestjs/common';
import * as QRCode from 'qrcode';
import { GlobalConfigService } from '../../config/global-config.service';
import { PaymentRequestQrFailedException } from '../exceptions/payment-request.exceptions';

const NETWORK_PASSPHRASES: Record<string, string> = {
  mainnet: 'Public Global Stellar Network ; September 2015',
  testnet: 'Test SDF Network ; September 2015',
  futurenet: 'Test SDF Future Network ; October 2022',
};

@Injectable()
export class QrCodeService {
  private readonly logger = new Logger(QrCodeService.name);

  constructor(private readonly configService: GlobalConfigService) {}

  buildSep0007Uri(params: {
    destination: string;
    amount: number;
    memo: string;
    network?: string;
  }): string {
    const stellarConfig = this.configService.getStellarConfig();
    const network = params.network || stellarConfig.activeNetwork;
    const passphrase =
      NETWORK_PASSPHRASES[network] || NETWORK_PASSPHRASES['testnet'];

    const uriParams = new URLSearchParams();
    uriParams.set('destination', params.destination);
    uriParams.set('amount', params.amount.toString());
    uriParams.set('asset_code', 'USDC');
    uriParams.set('memo', params.memo);
    uriParams.set('memo_type', 'MEMO_TEXT');
    uriParams.set('network_passphrase', passphrase);

    return `web+stellar:pay?${uriParams.toString()}`;
  }

  async generateQrCode(params: {
    destination: string;
    amount: number;
    memo: string;
    network?: string;
  }): Promise<string> {
    try {
      const uri = this.buildSep0007Uri(params);
      const buffer = await QRCode.toBuffer(uri, {
        type: 'png',
        width: 300,
        margin: 2,
      });
      return buffer.toString('base64');
    } catch (error) {
      this.logger.error('Failed to generate QR code', error);
      throw new PaymentRequestQrFailedException((error as Error).message);
    }
  }
}
