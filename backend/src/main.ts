import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { CustomValidationPipe } from './common/pipes/validation.pipe';
import { initSentry } from './common/config/sentry.config';

async function bootstrap() {
  // Initialize Sentry before creating the app
  initSentry();

  const app = await NestFactory.create(AppModule);

  // Use Winston logger
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  // Global exception filters (order matters - more specific first)
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global validation pipe
  app.useGlobalPipes(new CustomValidationPipe());

  // Swagger Documentation
  const { DocumentBuilder, SwaggerModule } = await import('@nestjs/swagger');
  const config = new DocumentBuilder()
    .setTitle('Dabdub Webhooks API')
    .setDescription('The Dabdub Webhooks Management API')
    .setVersion('1.0')
    .addTag('Webhooks')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
