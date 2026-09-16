import { Module } from '@nestjs/common';
import { StockModule } from '../stock/stock.module.js';
import { DashboardController } from './dashboard.controller.js';
import { DashboardService } from './dashboard.service.js';

@Module({
  imports: [StockModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
