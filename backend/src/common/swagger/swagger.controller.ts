import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Documentation')
@Controller('api/documentation')
export class SwaggerController {
  @Get('postman-collection')
  @ApiOperation({ summary: 'Export Postman collection' })
  @ApiResponse({
    status: 200,
    description: 'Postman collection JSON file',
  })
  async getPostmanCollection(@Res() res: Response): Promise<void> {
    const collection = {
      info: {
        name: 'Settlement API',
        description: 'Postman collection for Settlement API',
        schema:
          'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        {
          name: 'Health',
          item: [
            {
              name: 'Check Health',
              request: {
                method: 'GET',
                url: {
                  raw: '{{baseUrl}}/health',
                  host: ['{{baseUrl}}'],
                  path: ['health'],
                },
              },
            },
          ],
        },
      ],
      variable: [
        {
          key: 'baseUrl',
          value: 'http://localhost:3000',
        },
        {
          key: 'token',
          value: 'your_jwt_token_here',
        },
      ],
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=settlement-api.postman_collection.json',
    );
    res.send(JSON.stringify(collection, null, 2));
  }

  @Get('api-schema')
  @ApiOperation({ summary: 'Get OpenAPI schema' })
  @ApiResponse({
    status: 200,
    description: 'OpenAPI schema JSON',
  })
  getApiSchema(@Res() res: Response): void {
    res.setHeader('Content-Type', 'application/json');
    res.send({ message: 'OpenAPI schema endpoint' });
  }
}
