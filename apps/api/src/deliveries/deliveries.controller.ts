import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { uuidSchema } from '../common/uuid.schema.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { DeliveriesService } from './deliveries.service.js';
import {
  type CreateDeliveryDto,
  createDeliverySchema,
  type DeliveryDto,
  type UpdateDeliveryDto,
  updateDeliverySchema,
} from './delivery.dto.js';

const UuidParam = new ZodValidationPipe(uuidSchema);

/** Nested under the sale: a trip serves exactly one order. */
@Controller('campaigns/:campaignId/sales/:saleId/deliveries')
export class DeliveriesController {
  constructor(private readonly deliveries: DeliveriesService) {}

  @Post()
  create(
    @Param('campaignId', UuidParam) campaignId: string,
    @Param('saleId', UuidParam) saleId: string,
    @Body(new ZodValidationPipe(createDeliverySchema)) body: CreateDeliveryDto,
  ): Promise<DeliveryDto> {
    return this.deliveries.create(campaignId, saleId, body);
  }

  @Get()
  findAll(
    @Param('campaignId', UuidParam) campaignId: string,
    @Param('saleId', UuidParam) saleId: string,
  ): Promise<DeliveryDto[]> {
    return this.deliveries.findAll(campaignId, saleId);
  }

  @Get(':id')
  findOne(
    @Param('campaignId', UuidParam) campaignId: string,
    @Param('saleId', UuidParam) saleId: string,
    @Param('id', UuidParam) id: string,
  ): Promise<DeliveryDto> {
    return this.deliveries.findOne(campaignId, saleId, id);
  }

  @Patch(':id')
  update(
    @Param('campaignId', UuidParam) campaignId: string,
    @Param('saleId', UuidParam) saleId: string,
    @Param('id', UuidParam) id: string,
    @Body(new ZodValidationPipe(updateDeliverySchema)) body: UpdateDeliveryDto,
  ): Promise<DeliveryDto> {
    return this.deliveries.update(campaignId, saleId, id, body);
  }

  /** Cancels the delivery (soft delete). The row stays for history. */
  @Delete(':id')
  @HttpCode(204)
  cancel(
    @Param('campaignId', UuidParam) campaignId: string,
    @Param('saleId', UuidParam) saleId: string,
    @Param('id', UuidParam) id: string,
  ): Promise<void> {
    return this.deliveries.cancel(campaignId, saleId, id);
  }
}
