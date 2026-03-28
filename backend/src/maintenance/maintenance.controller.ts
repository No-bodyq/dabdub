import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceWindowResponseDto } from './dto/maintenance-window-response.dto';

@ApiTags('system')
@Controller({ path: 'system/maintenance', version: '1' })
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Get()
  @Public()
  @ApiOperation({ 
    summary: 'Get upcoming and active maintenance windows',
    description: 'Returns maintenance windows that are scheduled or currently active. Used by clients to show maintenance notifications.',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of maintenance windows',
    type: [MaintenanceWindowResponseDto],
  })
  async getMaintenanceWindows(): Promise<MaintenanceWindowResponseDto[]> {
    const [upcoming, active] = await Promise.all([
      this.maintenanceService.getUpcoming(),
      this.maintenanceService.getActive(),
    ]);

    // Combine and deduplicate (in case a window is both upcoming and active)
    const allWindows = [...active, ...upcoming];
    const uniqueWindows = allWindows.filter(
      (window, index, self) => 
        index === self.findIndex(w => w.id === window.id)
    );

    return uniqueWindows.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
  }
}