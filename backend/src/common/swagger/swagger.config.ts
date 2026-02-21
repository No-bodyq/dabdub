import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Settlement API')
    .setDescription('Comprehensive API documentation for Settlement system')
    .setVersion('2.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
      },
      'api-key',
    )
    .addServer('http://localhost:3000', 'Development')
    .addServer('https://api.example.com', 'Production')
    .addTag('Health', 'System health check endpoints')
    .addTag('Settlements', 'Settlement management endpoints')
    .addTag('Webhooks', 'Webhook configuration and delivery')
    .addTag('Authentication', 'Authentication endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Add custom metadata
  document.info.contact = {
    name: 'API Support',
    url: 'https://support.example.com',
    email: 'api@example.com',
  };

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorizationData: true,
      displayOperationId: true,
      docExpansion: 'list',
      defaultModelsExpandDepth: 1,
      defaultModelExpandDepth: 1,
      tryItOutEnabled: true,
      showRequestHeaders: true,
      requestSnippetsEnabled: true,
    },
    customCss: '.topbar { display: none }',
    customSiteTitle: 'Settlement API Documentation',
  });
}
