import { fileURLToPath } from 'node:url';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module.js';
import { BalancesModule } from './balances/balances.module.js';
import { CampaignsModule } from './campaigns/campaigns.module.js';
import { validateEnv } from './config/env.schema.js';
import { HealthController } from './health/health.controller.js';
import { KilnBatchesModule } from './kiln-batches/kiln-batches.module.js';
import { MouldersModule } from './moulders/moulders.module.js';
import { PaymentsModule } from './payments/payments.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ProductionsModule } from './productions/productions.module.js';
import { RiceFieldsModule } from './rice-fields/rice-fields.module.js';

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
  ],
  controllers: [HealthController],
})
export class AppModule {}
