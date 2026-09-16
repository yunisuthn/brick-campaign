import { existsSync } from 'node:fs';
import { dirname, join, sep } from 'node:path';
import type { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import type { NextFunction, Request, Response } from 'express';

/** Every route of the API lives under this prefix, in development, in test and online alike. */
export const API_PREFIX = 'api';

/** Middleware shared by main.ts and the e2e tests, so tests exercise the real request pipeline. */
export function configureApp(app: INestApplication): void {
  app.use(cookieParser());
  app.setGlobalPrefix(API_PREFIX);
}

/**
 * Serves the built front from the same origin as the API (reference document, section 10.2), so
 * the session cookie needs no CORS setup and there is one thing to deploy.
 *
 * Files under `assets/` carry a hash in their name and never change under it, so they are kept
 * for a year; the shell, the manifest and the service worker are re-read every time, or a phone
 * would hold an old application for good. Any other path that is not the API renders the shell,
 * which is what reloading a front route like `/productions` needs.
 */
export function serveWeb(app: NestExpressApplication, webRoot: string): void {
  const index = join(webRoot, 'index.html');
  if (!existsSync(index)) throw new Error(`No built front at ${webRoot}: run its build first`);

  app.useStaticAssets(webRoot, {
    index: false,
    setHeaders: (res, filePath) => {
      const hashed = dirname(filePath).split(sep).includes('assets');
      res.setHeader('Cache-Control', hashed ? 'public, max-age=31536000, immutable' : 'no-cache');
    },
  });
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET' || req.path.startsWith(`/${API_PREFIX}`)) return next();
    // Same rule as the shell served as a file: a phone must never hold an old one.
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(index);
  });
}
