import { Injectable, Logger } from '@nestjs/common';
import { GlobalConfigService } from '../config/global-config.service';

/**
 * Example service demonstrating how to use GlobalConfigService
 * This shows best practices for accessing configuration throughout the application
 */
@Injectable()
export class ConfigExampleService {
  private readonly logger = new Logger(ConfigExampleService.name);

  constructor(private configService: GlobalConfigService) {
    this.logConfiguration();
  }

  private logConfiguration(): void {
    this.logger.log('=== Configuration Summary ===');
    const summary = this.configService.getConfigSummary();
    this.logger.log(`Environment: ${summary.environment}`);
    this.logger.log(`Port: ${summary.port}`);
    this.logger.log(`Debug Enabled: ${summary.debugEnabled}`);
    this.logger.log(
      `Database: ${summary.database.host}:${summary.database.port}/${summary.database.database}`,
    );
    this.logger.log(`Database Pool Size: ${summary.database.poolSize}`);
  }

  /**
   * Example: Getting app configuration
   */
  getApplicationInfo(): {
    environment: string;
    port: number;
    isProduction: boolean;
    isDevelopment: boolean;
    debugEnabled: boolean;
  } {
    return {
      environment: this.configService.getNodeEnv(),
      port: this.configService.getPort(),
      isProduction: this.configService.isProduction(),
      isDevelopment: this.configService.isDevelopment(),
      debugEnabled: this.configService.isDebugEnabled(),
    };
  }

  /**
   * Example: Getting database configuration
   */
  getDatabaseConnectionInfo(): {
    host: string;
    port: number;
    database: string;
    poolSize: number;
  } {
    const dbConfig = this.configService.getDatabaseConfig();
    return {
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      poolSize: dbConfig.poolSize,
    };
  }

  /**
   * Example: Getting blockchain configuration
   * Note: These methods throw if not configured, use try-catch in production
   */
  getBlockchainInfo(): {
    chainId?: number;
    hasRpc: boolean;
    hasPrivateKey: boolean;
  } {
    try {
      return {
        chainId: this.configService.getChainId(),
        hasRpc: !!this.configService.getRpcEndpoint(),
        hasPrivateKey: !!this.configService.getSettlementPrivateKey(),
      };
    } catch (error) {
      this.logger.warn('Blockchain configuration incomplete');
      return {
        chainId: undefined,
        hasRpc: false,
        hasPrivateKey: false,
      };
    }
  }

  /**
   * Example: Conditional logic based on environment
   */
  shouldEnableDebugLogging(): boolean {
    return (
      this.configService.isDevelopment() && this.configService.isDebugEnabled()
    );
  }

  /**
   * Example: Using configuration in initialization logic
   */
  initializeServiceWithConfig(): void {
    const env = this.configService.getNodeEnv();

    if (this.configService.isProduction()) {
      this.logger.log('Running in PRODUCTION mode');
      // Enable stricter error handling
    } else if (this.configService.isStaging()) {
      this.logger.log('Running in STAGING mode');
      // Enable staging-specific features
    } else {
      this.logger.log('Running in DEVELOPMENT mode');
      // Enable development features
    }
  }
}
