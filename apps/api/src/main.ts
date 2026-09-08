import { config } from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

// Temporary: the root .env is loaded here until @nestjs/config with validation replaces it.
config({ path: new URL('../../../.env', import.meta.url), quiet: true });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
