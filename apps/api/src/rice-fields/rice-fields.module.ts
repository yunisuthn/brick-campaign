import { Module } from '@nestjs/common';
import { RiceFieldsController } from './rice-fields.controller.js';
import { RiceFieldsService } from './rice-fields.service.js';

@Module({
  controllers: [RiceFieldsController],
  providers: [RiceFieldsService],
})
export class RiceFieldsModule {}
