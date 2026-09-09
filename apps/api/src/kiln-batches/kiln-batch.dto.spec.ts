import {
  createKilnBatchSchema,
  MIN_KILN_BATCH_QUANTITY,
  updateKilnBatchSchema,
} from './kiln-batch.dto.js';

describe('createKilnBatchSchema', () => {
  it('defaults unloadedOn to null: the batch is still in the kiln', () => {
    expect(createKilnBatchSchema.parse({ loadedOn: '2026-07-01', quantity: 40000 })).toEqual({
      loadedOn: '2026-07-01',
      unloadedOn: null,
      quantity: 40000,
    });
  });

  it('refuses a firing below the minimum', () => {
    const body = { loadedOn: '2026-07-01', quantity: MIN_KILN_BATCH_QUANTITY - 1 };
    expect(createKilnBatchSchema.safeParse(body).success).toBe(false);
  });
});

describe('updateKilnBatchSchema', () => {
  it('leaves out unloadedOn when only the quantity is sent, so a fix never reopens a batch', () => {
    expect(updateKilnBatchSchema.parse({ quantity: 45000 })).toEqual({ quantity: 45000 });
  });

  it('rejects an empty body', () => {
    expect(updateKilnBatchSchema.safeParse({}).success).toBe(false);
  });
});
