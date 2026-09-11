import { HttpException } from '@nestjs/common';
import { apiError, validationError } from './api-error.js';

describe('apiError', () => {
  it('sends the code, the English message and the status the code names', () => {
    const error = apiError('campaign_not_found', 'Campaign x not found');
    expect(error).toBeInstanceOf(HttpException);
    expect(error.getStatus()).toBe(404);
    expect(error.getResponse()).toEqual({
      code: 'campaign_not_found',
      message: 'Campaign x not found',
    });
  });

  it('carries the numbers the sentence needs, and leaves the key out when there are none', () => {
    expect(
      apiError('raw_stock_too_low', 'Only 120 raw bricks in stock, cannot load 500', {
        available: 120,
        quantity: 500,
      }).getResponse(),
    ).toMatchObject({ details: { available: 120, quantity: 500 } });
    expect(apiError('moulder_inactive', 'Moulder x is inactive').getResponse()).not.toHaveProperty(
      'details',
    );
  });

  it('gives the same code one status wherever it is thrown', () => {
    expect(apiError('date_outside_campaign', 'a').getStatus()).toBe(400);
    expect(apiError('campaign_year_taken', 'b').getStatus()).toBe(409);
    expect(apiError('invalid_credentials', 'c').getStatus()).toBe(401);
  });
});

describe('validationError', () => {
  it('400s with one issue per field, so the front can place each one', () => {
    const error = validationError([{ path: 'quantity', message: 'Too small' }]);
    expect(error.getStatus()).toBe(400);
    expect(error.getResponse()).toEqual({
      code: 'validation_failed',
      message: 'Validation failed',
      issues: [{ path: 'quantity', message: 'Too small' }],
    });
  });
});
