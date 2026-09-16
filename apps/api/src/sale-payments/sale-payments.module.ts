import { Module } from '@nestjs/common';
import { EntriesModule } from '../entries/entries.module.js';
import { SalesModule } from '../sales/sales.module.js';
import { SalePaymentsController } from './sale-payments.controller.js';
import { SalePaymentsService } from './sale-payments.service.js';

@Module({
  imports: [EntriesModule, SalesModule],
  controllers: [SalePaymentsController],
  providers: [SalePaymentsService],
})
export class SalePaymentsModule {}
