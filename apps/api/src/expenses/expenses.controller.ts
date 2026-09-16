import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { uuidSchema } from '../common/uuid.schema.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import {
  type CreateExpenseDto,
  createExpenseSchema,
  type ExpenseDto,
  type ListExpensesQuery,
  listExpensesQuerySchema,
  type UpdateExpenseDto,
  updateExpenseSchema,
} from './expense.dto.js';
import { ExpensesService } from './expenses.service.js';

const UuidParam = new ZodValidationPipe(uuidSchema);

/** Nested under the campaign: every expense belongs to exactly one season. */
@Controller('campaigns/:campaignId/expenses')
export class ExpensesController {
  constructor(private readonly expenses: ExpensesService) {}

  @Post()
  create(
    @Param('campaignId', UuidParam) campaignId: string,
    @Body(new ZodValidationPipe(createExpenseSchema)) body: CreateExpenseDto,
  ): Promise<ExpenseDto> {
    return this.expenses.create(campaignId, body);
  }

  @Get()
  findAll(
    @Param('campaignId', UuidParam) campaignId: string,
    @Query(new ZodValidationPipe(listExpensesQuerySchema)) query: ListExpensesQuery,
  ): Promise<ExpenseDto[]> {
    return this.expenses.findAll(campaignId, query);
  }

  @Get(':id')
  findOne(
    @Param('campaignId', UuidParam) campaignId: string,
    @Param('id', UuidParam) id: string,
  ): Promise<ExpenseDto> {
    return this.expenses.findOne(campaignId, id);
  }

  @Patch(':id')
  update(
    @Param('campaignId', UuidParam) campaignId: string,
    @Param('id', UuidParam) id: string,
    @Body(new ZodValidationPipe(updateExpenseSchema)) body: UpdateExpenseDto,
  ): Promise<ExpenseDto> {
    return this.expenses.update(campaignId, id, body);
  }

  /** Cancels the expense (soft delete). The row stays for history. */
  @Delete(':id')
  @HttpCode(204)
  cancel(
    @Param('campaignId', UuidParam) campaignId: string,
    @Param('id', UuidParam) id: string,
  ): Promise<void> {
    return this.expenses.cancel(campaignId, id);
  }
}
