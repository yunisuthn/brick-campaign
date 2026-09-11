import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { uuidSchema } from '../common/uuid.schema.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import {
  type CreateSalePaymentDto,
  createSalePaymentSchema,
  type SalePaymentDto,
  type UpdateSalePaymentDto,
  updateSalePaymentSchema,
} from './sale-payment.dto.js';
import { SalePaymentsService } from './sale-payments.service.js';

const UuidParam = new ZodValidationPipe(uuidSchema);

/** Nested under the sale: an instalment settles exactly one order. */
@Controller('campaigns/:campaignId/sales/:saleId/payments')
export class SalePaymentsController {
  constructor(private readonly payments: SalePaymentsService) {}

  @Post()
  create(
    @Param('campaignId', UuidParam) campaignId: string,
    @Param('saleId', UuidParam) saleId: string,
    @Body(new ZodValidationPipe(createSalePaymentSchema)) body: CreateSalePaymentDto,
  ): Promise<SalePaymentDto> {
    return this.payments.create(campaignId, saleId, body);
  }

  @Get()
  findAll(
    @Param('campaignId', UuidParam) campaignId: string,
    @Param('saleId', UuidParam) saleId: string,
  ): Promise<SalePaymentDto[]> {
    return this.payments.findAll(campaignId, saleId);
  }

  @Get(':id')
  findOne(
    @Param('campaignId', UuidParam) campaignId: string,
    @Param('saleId', UuidParam) saleId: string,
    @Param('id', UuidParam) id: string,
  ): Promise<SalePaymentDto> {
    return this.payments.findOne(campaignId, saleId, id);
  }

  @Patch(':id')
  update(
    @Param('campaignId', UuidParam) campaignId: string,
    @Param('saleId', UuidParam) saleId: string,
    @Param('id', UuidParam) id: string,
    @Body(new ZodValidationPipe(updateSalePaymentSchema)) body: UpdateSalePaymentDto,
  ): Promise<SalePaymentDto> {
    return this.payments.update(campaignId, saleId, id, body);
  }

  /** Cancels the instalment (soft delete). The row stays for history. */
  @Delete(':id')
  @HttpCode(204)
  cancel(
    @Param('campaignId', UuidParam) campaignId: string,
    @Param('saleId', UuidParam) saleId: string,
    @Param('id', UuidParam) id: string,
  ): Promise<void> {
    return this.payments.cancel(campaignId, saleId, id);
  }
}
