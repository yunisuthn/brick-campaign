import { Module } from '@nestjs/common';
import { MouldersController } from './moulders.controller.js';
import { MouldersService } from './moulders.service.js';

@Module({
  controllers: [MouldersController],
  providers: [MouldersService],
})
export class MouldersModule {}
