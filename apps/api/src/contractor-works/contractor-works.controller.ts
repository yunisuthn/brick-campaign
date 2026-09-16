import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { uuidSchema } from '../common/uuid.schema.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import {
  type ContractorWorkDto,
  type CreateContractorWorkDto,
  createContractorWorkSchema,
  type ListContractorWorksQuery,
  listContractorWorksQuerySchema,
  type UpdateContractorWorkDto,
  updateContractorWorkSchema,
} from './contractor-work.dto.js';
import { ContractorWorksService } from './contractor-works.service.js';

const UuidParam = new ZodValidationPipe(uuidSchema);

/** Nested under the campaign: every entry belongs to exactly one season. */
@Controller('campaigns/:campaignId/contractor-works')
export class ContractorWorksController {
  constructor(private readonly works: ContractorWorksService) {}

  @Post()
  create(
    @Param('campaignId', UuidParam) campaignId: string,
    @Body(new ZodValidationPipe(createContractorWorkSchema)) body: CreateContractorWorkDto,
  ): Promise<ContractorWorkDto> {
    return this.works.create(campaignId, body);
  }

  @Get()
  findAll(
    @Param('campaignId', UuidParam) campaignId: string,
    @Query(new ZodValidationPipe(listContractorWorksQuerySchema)) query: ListContractorWorksQuery,
  ): Promise<ContractorWorkDto[]> {
    return this.works.findAll(campaignId, query);
  }

  @Get(':id')
  findOne(
    @Param('campaignId', UuidParam) campaignId: string,
    @Param('id', UuidParam) id: string,
  ): Promise<ContractorWorkDto> {
    return this.works.findOne(campaignId, id);
  }

  @Patch(':id')
  update(
    @Param('campaignId', UuidParam) campaignId: string,
    @Param('id', UuidParam) id: string,
    @Body(new ZodValidationPipe(updateContractorWorkSchema)) body: UpdateContractorWorkDto,
  ): Promise<ContractorWorkDto> {
    return this.works.update(campaignId, id, body);
  }

  /** Cancels the entry (soft delete). The row stays for history. */
  @Delete(':id')
  @HttpCode(204)
  cancel(
    @Param('campaignId', UuidParam) campaignId: string,
    @Param('id', UuidParam) id: string,
  ): Promise<void> {
    return this.works.cancel(campaignId, id);
  }
}
