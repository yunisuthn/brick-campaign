import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { uuidSchema } from '../common/uuid.schema.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import {
  type CreatePaymentDto,
  createPaymentSchema,
  type ListPaymentsQuery,
  listPaymentsQuerySchema,
  type PaymentDto,
  type UpdatePaymentDto,
  updatePaymentSchema,
} from './payment.dto.js';
import { PaymentsService } from './payments.service.js';

const UuidParam = new ZodValidationPipe(uuidSchema);

/** Nested under the campaign: every payment belongs to exactly one season. */
@Controller('campaigns/:campaignId/payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post()
  create(
    @Param('campaignId', UuidParam) campaignId: string,
    @Body(new ZodValidationPipe(createPaymentSchema)) body: CreatePaymentDto,
  ): Promise<PaymentDto> {
    return this.payments.create(campaignId, body);
  }

  @Get()
  findAll(
    @Param('campaignId', UuidParam) campaignId: string,
    @Query(new ZodValidationPipe(listPaymentsQuerySchema)) query: ListPaymentsQuery,
  ): Promise<PaymentDto[]> {
    return this.payments.findAll(campaignId, query);
  }

  @Get(':id')
  findOne(
    @Param('campaignId', UuidParam) campaignId: string,
    @Param('id', UuidParam) id: string,
  ): Promise<PaymentDto> {
    return this.payments.findOne(campaignId, id);
  }

  @Patch(':id')
  update(
    @Param('campaignId', UuidParam) campaignId: string,
    @Param('id', UuidParam) id: string,
    @Body(new ZodValidationPipe(updatePaymentSchema)) body: UpdatePaymentDto,
  ): Promise<PaymentDto> {
    return this.payments.update(campaignId, id, body);
  }

  /** Cancels the payment (soft delete). The row stays for history. */
  @Delete(':id')
  @HttpCode(204)
  cancel(
    @Param('campaignId', UuidParam) campaignId: string,
    @Param('id', UuidParam) id: string,
  ): Promise<void> {
    return this.payments.cancel(campaignId, id);
  }
}
