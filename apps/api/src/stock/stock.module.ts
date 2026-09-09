import { Module } from '@nestjs/common';
import { StockController } from './stock.controller.js';
import { StockService } from './stock.service.js';

/** Exports the service: kiln batches check the raw stock before loading. */
@Module({
  controllers: [StockController],
  providers: [StockService],
  exports: [StockService],
})
export class StockModule {}
