import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { API_CHANGELOG } from './changelog';

@ApiTags('Documentation')
@Controller('api/changelog')
export class ChangelogController {
  @Get()
  @ApiOperation({
    summary: 'Get API changelog',
    description: 'Retrieves the complete changelog of API versions and changes',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'API changelog retrieved',
  })
  getChangelog() {
    return {
      changelog: API_CHANGELOG,
      latestVersion: API_CHANGELOG[0].version,
    };
  }
}
