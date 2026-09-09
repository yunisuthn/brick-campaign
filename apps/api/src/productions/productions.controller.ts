import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { uuidSchema } from '../common/uuid.schema.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import {
  type CreateProductionDto,
  createProductionSchema,
  type ListProductionsQuery,
  listProductionsQuerySchema,
  type ProductionDto,
  type UpdateProductionDto,
  updateProductionSchema,
} from './production.dto.js';
import { ProductionsService } from './productions.service.js';

const UuidParam = new ZodValidationPipe(uuidSchema);

/** Nested under the campaign: every entry belongs to exactly one season. */
@Controller('campaigns/:campaignId/productions')
export class ProductionsController {
  constructor(private readonly productions: ProductionsService) {}

  @Post()
  create(
    @Param('campaignId', UuidParam) campaignId: string,
    @Body(new ZodValidationPipe(createProductionSchema)) body: CreateProductionDto,
  ): Promise<ProductionDto> {
    return this.productions.create(campaignId, body);
  }

  @Get()
  findAll(
    @Param('campaignId', UuidParam) campaignId: string,
    @Query(new ZodValidationPipe(listProductionsQuerySchema)) query: ListProductionsQuery,
  ): Promise<ProductionDto[]> {
    return this.productions.findAll(campaignId, query);
  }

  @Get(':id')
  findOne(
    @Param('campaignId', UuidParam) campaignId: string,
    @Param('id', UuidParam) id: string,
  ): Promise<ProductionDto> {
    return this.productions.findOne(campaignId, id);
  }

  @Patch(':id')
  update(
    @Param('campaignId', UuidParam) campaignId: string,
    @Param('id', UuidParam) id: string,
    @Body(new ZodValidationPipe(updateProductionSchema)) body: UpdateProductionDto,
  ): Promise<ProductionDto> {
    return this.productions.update(campaignId, id, body);
  }

  /** Cancels the entry (soft delete). The row stays for history. */
  @Delete(':id')
  @HttpCode(204)
  cancel(
    @Param('campaignId', UuidParam) campaignId: string,
    @Param('id', UuidParam) id: string,
  ): Promise<void> {
    return this.productions.cancel(campaignId, id);
  }
}
