import { HttpException } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from './zod-validation.pipe.js';

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  quantity: z.int().positive(),
  date: z.iso.date(),
});

function issuesOf(body: unknown) {
  try {
    new ZodValidationPipe(schema).transform(body);
  } catch (error: unknown) {
    return (error as HttpException).getResponse() as { issues: unknown[] };
  }
  throw new Error('Expected the body to be refused');
}

describe('ZodValidationPipe', () => {
  it('hands back the parsed value when the body fits', () => {
    const body = { name: 'Rasoa', quantity: 1000, date: '2026-05-01' };
    expect(new ZodValidationPipe(schema).transform(body)).toEqual(body);
  });

  it('names the field and the bound it crossed, so the front can say it in French', () => {
    const { issues } = issuesOf({ name: 'x'.repeat(121), quantity: 1000, date: '2026-05-01' });
    expect(issues).toEqual([
      {
        path: 'name',
        message: expect.any(String),
        kind: 'too_big',
        origin: 'string',
        limit: 120,
        inclusive: true,
      },
    ]);
  });

  it('reports a bound as zod means it: positive() refuses 0 without allowing it', () => {
    const { issues } = issuesOf({ name: 'Rasoa', quantity: 0, date: '2026-05-01' });
    expect(issues).toMatchObject([
      { path: 'quantity', kind: 'too_small', limit: 0, inclusive: false },
    ]);
  });

  it('reports a missing or mistyped field as a type problem, naming what was expected', () => {
    const { issues } = issuesOf({ quantity: 'lots', date: '2026-05-01' });
    expect(issues).toMatchObject([
      { path: 'name', kind: 'invalid_type', origin: 'string' },
      { path: 'quantity', kind: 'invalid_type', origin: 'number' },
    ]);
  });

  it('reports a malformed date as a format problem', () => {
    const { issues } = issuesOf({ name: 'Rasoa', quantity: 1000, date: 'May 2026' });
    expect(issues).toMatchObject([{ path: 'date', kind: 'invalid_format' }]);
  });
});
