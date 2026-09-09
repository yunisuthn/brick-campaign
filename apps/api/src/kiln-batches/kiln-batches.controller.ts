import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { uuidSchema } from '../common/uuid.schema.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import {
  type CreateKilnBatchDto,
  createKilnBatchSchema,
  type KilnBatchDto,
  type UpdateKilnBatchDto,
  updateKilnBatchSchema,
} from './kiln-batch.dto.js';
import { KilnBatchesService } from './kiln-batches.service.js';

const UuidParam = new ZodValidationPipe(uuidSchema);

/** Nested under the campaign: every firing belongs to exactly one season. */
@Controller('campaigns/:campaignId/kiln-batches')
export class KilnBatchesController {
  constructor(private readonly kilnBatches: KilnBatchesService) {}

  @Post()
  create(
    @Param('campaignId', UuidParam) campaignId: string,
    @Body(new ZodValidationPipe(createKilnBatchSchema)) body: CreateKilnBatchDto,
  ): Promise<KilnBatchDto> {
    return this.kilnBatches.create(campaignId, body);
  }

  @Get()
  findAll(@Param('campaignId', UuidParam) campaignId: string): Promise<KilnBatchDto[]> {
    return this.kilnBatches.findAll(campaignId);
  }

  @Get(':id')
  findOne(
    @Param('campaignId', UuidParam) campaignId: string,
    @Param('id', UuidParam) id: string,
  ): Promise<KilnBatchDto> {
    return this.kilnBatches.findOne(campaignId, id);
  }

  @Patch(':id')
  update(
    @Param('campaignId', UuidParam) campaignId: string,
    @Param('id', UuidParam) id: string,
    @Body(new ZodValidationPipe(updateKilnBatchSchema)) body: UpdateKilnBatchDto,
  ): Promise<KilnBatchDto> {
    return this.kilnBatches.update(campaignId, id, body);
  }

  /** Cancels the batch (soft delete). The row stays for history. */
  @Delete(':id')
  @HttpCode(204)
  cancel(
    @Param('campaignId', UuidParam) campaignId: string,
    @Param('id', UuidParam) id: string,
  ): Promise<void> {
    return this.kilnBatches.cancel(campaignId, id);
  }
}
