import { Module } from '@nestjs/common';
import { EntriesModule } from '../entries/entries.module.js';
import { ProductionsController } from './productions.controller.js';
import { ProductionsService } from './productions.service.js';

@Module({
  imports: [EntriesModule],
  controllers: [ProductionsController],
  providers: [ProductionsService],
})
export class ProductionsModule {}
