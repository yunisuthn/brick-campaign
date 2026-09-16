import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module.js';
import { configureApp, serveWeb } from '../src/app.setup.js';

/** A built front, reduced to what the serving rules care about: a shell and a hashed asset. */
function fakeBuild(): string {
  const root = mkdtempSync(join(tmpdir(), 'brick-web-'));
  writeFileSync(join(root, 'index.html'), '<!doctype html><title>Briqueterie</title>');
  mkdirSync(join(root, 'assets'));
  writeFileSync(join(root, 'assets', 'app-1a2b3c4d.js'), 'console.log(1);');
  return root;
}

describe('The front served by the API (e2e)', () => {
  let app: NestExpressApplication;
  let server: App;
  let root: string;

  beforeAll(async () => {
    root = fakeBuild();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app);
    serveWeb(app, root);
    await app.init();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
    rmSync(root, { recursive: true, force: true });
  });

  it('renders the shell on a front route, so a reload lands somewhere', async () => {
    const res = await request(server).get('/productions').expect(200);
    expect(res.text).toContain('Briqueterie');
  });

  it('leaves the API alone: an unknown route under the prefix never becomes the shell', async () => {
    const res = await request(server).get('/api/nothing-here');
    expect([401, 404]).toContain(res.status);
    expect(res.text).not.toContain('<!doctype html>');
  });

  it('keeps a hashed asset for a year and re-reads the shell every time', async () => {
    const asset = await request(server).get('/assets/app-1a2b3c4d.js').expect(200);
    expect(asset.headers['cache-control']).toBe('public, max-age=31536000, immutable');
    const shell = await request(server).get('/').expect(200);
    expect(shell.headers['cache-control']).toBe('no-cache');
  });

  it('refuses to start on a folder with no build in it', () => {
    expect(() => serveWeb(app, join(root, 'nowhere'))).toThrow(/No built front/);
  });
});
