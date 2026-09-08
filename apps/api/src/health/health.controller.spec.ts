import { ServiceUnavailableException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service.js';
import { HealthController } from './health.controller.js';

describe('HealthController', () => {
  async function buildController(queryRaw: () => Promise<unknown>): Promise<HealthController> {
    const module = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: PrismaService, useValue: { $queryRaw: queryRaw } }],
    }).compile();
    return module.get(HealthController);
  }

  it('reports the database as up when SELECT 1 succeeds', async () => {
    const controller = await buildController(() => Promise.resolve([{ '?column?': 1 }]));
    await expect(controller.check()).resolves.toEqual({ status: 'ok', database: 'up' });
  });

  it('answers 503 when the database is unreachable', async () => {
    const controller = await buildController(() => Promise.reject(new Error('ECONNREFUSED')));
    await expect(controller.check()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
