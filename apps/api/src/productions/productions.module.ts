import { Module } from '@nestjs/common';
import { ProductionsController } from './productions.controller.js';
import { ProductionsService } from './productions.service.js';

@Module({
  controllers: [ProductionsController],
  providers: [ProductionsService],
})
export class ProductionsModule {}
