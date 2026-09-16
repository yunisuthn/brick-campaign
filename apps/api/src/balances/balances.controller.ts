import { Controller, Get, Param } from '@nestjs/common';
import { z } from 'zod';
import { uuidSchema } from '../common/uuid.schema.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import {
  BalancesService,
  type ContractorBalanceDto,
  type MoulderBalanceDto,
} from './balances.service.js';

const UuidParam = new ZodValidationPipe(uuidSchema);

/** Read-only views computed from the entries of a campaign. */
@Controller('campaigns/:campaignId/balances')
export class BalancesController {
  constructor(private readonly balances: BalancesService) {}

  @Get('moulders')
  moulders(@Param('campaignId', UuidParam) campaignId: string): Promise<MoulderBalanceDto[]> {
    return this.balances.moulders(campaignId);
  }

  @Get('moulders/:moulderId')
  moulder(
    @Param('campaignId', UuidParam) campaignId: string,
    @Param('moulderId', UuidParam) moulderId: string,
  ): Promise<MoulderBalanceDto> {
    return this.balances.moulder(campaignId, moulderId);
  }

  @Get('contractors')
  contractors(@Param('campaignId', UuidParam) campaignId: string): Promise<ContractorBalanceDto[]> {
    return this.balances.contractors(campaignId);
  }

  /** The name is the identifier: URL-encode it (spaces, accents). */
  @Get('contractors/:name')
  contractor(
    @Param('campaignId', UuidParam) campaignId: string,
    @Param('name', new ZodValidationPipe(z.string().trim().min(1))) name: string,
  ): Promise<ContractorBalanceDto> {
    return this.balances.contractor(campaignId, name);
  }
}
