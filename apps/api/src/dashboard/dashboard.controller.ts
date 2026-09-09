import { Controller, Get, Param } from '@nestjs/common';
import { uuidSchema } from '../common/uuid.schema.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { type DashboardDto, DashboardService } from './dashboard.service.js';

/** Read-only view computed from every entry of a campaign. */
@Controller('campaigns/:campaignId/dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  overview(
    @Param('campaignId', new ZodValidationPipe(uuidSchema)) campaignId: string,
  ): Promise<DashboardDto> {
    return this.dashboard.overview(campaignId);
  }
}
