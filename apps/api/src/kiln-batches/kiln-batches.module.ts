import { Module } from '@nestjs/common';
import { EntriesModule } from '../entries/entries.module.js';
import { StockModule } from '../stock/stock.module.js';
import { KilnBatchesController } from './kiln-batches.controller.js';
import { KilnBatchesService } from './kiln-batches.service.js';

@Module({
  imports: [EntriesModule, StockModule],
  controllers: [KilnBatchesController],
  providers: [KilnBatchesService],
})
export class KilnBatchesModule {}
