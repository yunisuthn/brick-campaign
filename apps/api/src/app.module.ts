import { fileURLToPath } from 'node:url';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ContractorWorksModule } from './contractor-works/contractor-works.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';
import { DeliveriesModule } from './deliveries/deliveries.module.js';
import { ExpensesModule } from './expenses/expenses.module.js';
import { AuthModule } from './auth/auth.module.js';
import { BalancesModule } from './balances/balances.module.js';
import { CampaignsModule } from './campaigns/campaigns.module.js';
import { ClientsModule } from './clients/clients.module.js';
import { validateEnv } from './config/env.schema.js';
import { HealthController } from './health/health.controller.js';
import { KilnBatchesModule } from './kiln-batches/kiln-batches.module.js';
import { MouldersModule } from './moulders/moulders.module.js';
import { PaymentsModule } from './payments/payments.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ProductionsModule } from './productions/productions.module.js';
import { RiceFieldsModule } from './rice-fields/rice-fields.module.js';
import { SalesModule } from './sales/sales.module.js';

// Single .env at the monorepo root; resolved from this file so it works from src/ and dist/.
const rootEnvFile = fileURLToPath(new URL('../../../.env', import.meta.url));

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: rootEnvFile, validate: validateEnv }),
    PrismaModule,
    AuthModule,
    CampaignsModule,
    MouldersModule,
    RiceFieldsModule,
    ProductionsModule,
    PaymentsModule,
    BalancesModule,
    KilnBatchesModule,
    ContractorWorksModule,
    ClientsModule,
    SalesModule,
    DeliveriesModule,
    ExpensesModule,
    DashboardModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
