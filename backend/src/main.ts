import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import {
  telemetryConfig,
  type AppConfig,
  type TelemetryConfig,
} from './config';
import { shutdownTelemetry, startTelemetry } from './telemetry/telemetry';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const telemetry = telemetryConfig() as unknown as () => TelemetryConfig;
  startTelemetry(telemetry());
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const config = app.get(ConfigService);
  const port = config.get<AppConfig['port']>('app.port')!;
  const apiPrefix = config.get<AppConfig['apiPrefix']>('app.apiPrefix')!;

  app.enableCors();
  app.setGlobalPrefix(apiPrefix);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Cheese Backend API')
    .setDescription('API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document);

  process.once('SIGTERM', () => {
    void shutdownTelemetry();
  });

  await app.listen(port);
  logger.log(`Application running on http://localhost:${port}/${apiPrefix}`);
  logger.log(`Swagger docs at http://localhost:${port}/${apiPrefix}/docs`);
}

void bootstrap();
