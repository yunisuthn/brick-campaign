import { Controller, Get, Param } from '@nestjs/common';
import { uuidSchema } from '../common/uuid.schema.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { type StockDto, StockService } from './stock.service.js';

/** Read-only view computed from the entries of a campaign. */
@Controller('campaigns/:campaignId/stock')
export class StockController {
  constructor(private readonly stock: StockService) {}

  @Get()
  overview(
    @Param('campaignId', new ZodValidationPipe(uuidSchema)) campaignId: string,
  ): Promise<StockDto> {
    return this.stock.overview(campaignId);
  }
}
