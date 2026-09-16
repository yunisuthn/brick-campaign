import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { uuidSchema } from '../common/uuid.schema.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import {
  type CreateSaleDto,
  createSaleSchema,
  type SaleDto,
  type UpdateSaleDto,
  updateSaleSchema,
} from './sale.dto.js';
import { SalesService } from './sales.service.js';

const UuidParam = new ZodValidationPipe(uuidSchema);

/** Nested under the campaign: every sale belongs to exactly one season. */
@Controller('campaigns/:campaignId/sales')
export class SalesController {
  constructor(private readonly sales: SalesService) {}

  @Post()
  create(
    @Param('campaignId', UuidParam) campaignId: string,
    @Body(new ZodValidationPipe(createSaleSchema)) body: CreateSaleDto,
  ): Promise<SaleDto> {
    return this.sales.create(campaignId, body);
  }

  @Get()
  findAll(@Param('campaignId', UuidParam) campaignId: string): Promise<SaleDto[]> {
    return this.sales.findAll(campaignId);
  }

  @Get(':id')
  findOne(
    @Param('campaignId', UuidParam) campaignId: string,
    @Param('id', UuidParam) id: string,
  ): Promise<SaleDto> {
    return this.sales.findOne(campaignId, id);
  }

  @Patch(':id')
  update(
    @Param('campaignId', UuidParam) campaignId: string,
    @Param('id', UuidParam) id: string,
    @Body(new ZodValidationPipe(updateSaleSchema)) body: UpdateSaleDto,
  ): Promise<SaleDto> {
    return this.sales.update(campaignId, id, body);
  }

  /** Cancels the sale (soft delete). The row stays for history. */
  @Delete(':id')
  @HttpCode(204)
  cancel(
    @Param('campaignId', UuidParam) campaignId: string,
    @Param('id', UuidParam) id: string,
  ): Promise<void> {
    return this.sales.cancel(campaignId, id);
  }
}
