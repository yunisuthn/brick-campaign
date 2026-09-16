import { Module } from '@nestjs/common';
import { EntriesModule } from '../entries/entries.module.js';
import { ContractorWorksController } from './contractor-works.controller.js';
import { ContractorWorksService } from './contractor-works.service.js';

@Module({
  imports: [EntriesModule],
  controllers: [ContractorWorksController],
  providers: [ContractorWorksService],
})
export class ContractorWorksModule {}
