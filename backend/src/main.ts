import { NestFactory, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor, ValidationPipe, RequestMethod } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { readTelemetryConfig, shutdownTelemetry, startTelemetry } from './telemetry/telemetry';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { version } = require('../package.json') as { version: string };

async function bootstrap(): Promise<void> {
  startTelemetry(readTelemetryConfig());
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService);
  const port = parseInt(String(config.get('PORT', 3000)), 10);
  const apiPrefix = String(config.get('API_PREFIX', 'api/v1'));

  app.enableCors();
  app.setGlobalPrefix(apiPrefix, {
    exclude: [
      { path: 'health', method: RequestMethod.ALL },
      { path: 'health/ready', method: RequestMethod.ALL },
      { path: 'docs', method: RequestMethod.ALL },
      { path: 'docs/(.*)', method: RequestMethod.ALL },
      { path: 'docs-json', method: RequestMethod.GET },
    ],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalInterceptors(new LoggingInterceptor(), new ClassSerializerInterceptor(app.get(Reflector)));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('CheesePay API')
    .setDescription(
      'Crypto-to-Fiat settlement platform. Use **Authorize** for JWT Bearer and/or **X-API-Key** for API key auth. ' +
        `HTTP API routes are under \`/${apiPrefix}\`; Swagger UI is at \`/docs\`.`,
    )
    .setVersion(version)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT from POST /auth/login or /auth/register',
      },
      'bearer',
    )
    .addApiKey(
      {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'Merchant API key (when using API key auth instead of Bearer)',
      },
      'api-key',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'CheesePay API',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
      tryItOutEnabled: true,
      displayRequestDuration: true,
    },
  });

  process.once('SIGTERM', () => {
    void shutdownTelemetry();
  });
  process.once('SIGINT', () => {
    void shutdownTelemetry();
  });

  await app.listen(port);
}

void bootstrap();
