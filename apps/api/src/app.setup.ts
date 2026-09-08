import type { INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';

/** Middleware shared by main.ts and the e2e tests, so tests exercise the real request pipeline. */
export function configureApp(app: INestApplication): void {
  app.use(cookieParser());
}
