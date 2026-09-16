import { Module } from '@nestjs/common';
import { EntriesModule } from '../entries/entries.module.js';
import { SalesController } from './sales.controller.js';
import { SalesService } from './sales.service.js';

/** Exports the service: deliveries look their sale up before recording a trip. */
@Module({
  imports: [EntriesModule],
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService],
})
export class SalesModule {}
