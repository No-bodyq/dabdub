export interface ApiVersion {
  version: string;
  releaseDate: string;
  changes: {
    type: 'added' | 'changed' | 'deprecated' | 'removed' | 'fixed';
    description: string;
    endpoints?: string[];
  }[];
}

export const API_CHANGELOG: ApiVersion[] = [
  {
    version: '2.0.0',
    releaseDate: '2024-01-20',
    changes: [
      {
        type: 'added',
        description: 'Full API versioning with URI strategy (v1, v2)',
        endpoints: ['/v1/settlements', '/v2/settlements'],
      },
      {
        type: 'added',
        description: 'Comprehensive Swagger/OpenAPI documentation',
        endpoints: ['/api/docs'],
      },
      {
        type: 'added',
        description:
          'Webhook delivery retry mechanism with exponential backoff',
        endpoints: ['/v1/webhooks'],
      },
      {
        type: 'added',
        description: 'Rate limiting per API key',
      },
      {
        type: 'changed',
        description: 'Improved error response format with request IDs',
      },
      {
        type: 'deprecated',
        description: 'Legacy settlement endpoints will be removed in v3.0.0',
      },
    ],
  },
  {
    version: '1.0.0',
    releaseDate: '2023-12-01',
    changes: [
      {
        type: 'added',
        description: 'Initial API release',
        endpoints: ['/settlements', '/webhooks'],
      },
    ],
  },
];
