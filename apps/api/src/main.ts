import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { configureApp, serveWeb } from './app.setup.js';
import type { Env } from './config/env.schema.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  configureApp(app);
  const config = app.get<ConfigService<Env, true>>(ConfigService);
  // Set where the built front sits, and this process serves it too; left unset, Vite does.
  const webRoot = config.get('WEB_ROOT', { infer: true });
  if (webRoot !== undefined) serveWeb(app, webRoot);
  await app.listen(config.get('PORT', { infer: true }));
}
await bootstrap();
