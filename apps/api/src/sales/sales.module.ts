import { Module } from '@nestjs/common';
import { EntriesModule } from '../entries/entries.module.js';
import { SalesController } from './sales.controller.js';
import { SalesService } from './sales.service.js';

@Module({
  imports: [EntriesModule],
  controllers: [SalesController],
  providers: [SalesService],
})
export class SalesModule {}
