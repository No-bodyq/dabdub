export const API_METADATA = {
  title: 'Settlement API',
  description: 'Comprehensive REST API for managing settlements and webhooks',
  version: '2.0.0',
  author: 'Your Company Name',
  contact: {
    name: 'API Support',
    url: 'https://support.example.com',
    email: 'api-support@example.com',
  },
  license: {
    name: 'MIT',
    url: 'https://opensource.org/licenses/MIT',
  },
  externalDocs: {
    description: 'Full API Documentation',
    url: 'https://docs.example.com',
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Local Development',
      variables: {
        basePath: {
          default: '',
        },
      },
    },
    {
      url: 'https://api-staging.example.com',
      description: 'Staging Environment',
    },
    {
      url: 'https://api.example.com',
      description: 'Production Environment',
    },
  ],
  securitySchemes: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'JWT Token for authentication',
    },
    apiKeyAuth: {
      type: 'apiKey',
      in: 'header',
      name: 'X-API-Key',
      description: 'API Key for authentication',
    },
  },
  tags: [
    {
      name: 'Health',
      description: 'System health and status endpoints',
    },
    {
      name: 'Settlements',
      description: 'Settlement management and CRUD operations',
    },
    {
      name: 'Webhooks',
      description: 'Webhook configuration and event subscriptions',
    },
    {
      name: 'Documentation',
      description: 'API documentation and metadata endpoints',
    },
    {
      name: 'Authentication',
      description: 'User authentication and authorization',
    },
  ],
};
