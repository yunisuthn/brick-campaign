import type { ErrorCode, ErrorDetails } from 'contracts';
import { ApiError } from './client.js';
import { apiErrorMessage } from './errorMessages.js';
import { plain } from '../test/text.js';

function refusal(status: number, code: ErrorCode, details?: ErrorDetails) {
  return new ApiError(status, { message: 'English, for the logs', code, details });
}

describe('apiErrorMessage', () => {
  it('says the refusal in French', () => {
    expect(apiErrorMessage(refusal(404, 'campaign_not_found'))).toBe(
      'Cette campagne n’existe plus.',
    );
    expect(apiErrorMessage(refusal(400, 'moulder_inactive'))).toBe(
      'Ce mouleur est retiré : plus aucune saisie à son nom.',
    );
  });

  it('names the campaign window, open-ended or not', () => {
    expect(
      apiErrorMessage(
        refusal(400, 'date_outside_campaign', { startedOn: '2026-05-01', closedOn: null }),
      ),
    ).toBe('La date doit tomber dans la campagne, donc à partir du 1 mai 2026.');
    expect(
      apiErrorMessage(
        refusal(400, 'date_outside_campaign', { startedOn: '2026-05-01', closedOn: '2026-11-30' }),
      ),
    ).toBe('La date doit tomber dans la campagne, entre le 1 mai 2026 et le 30 novembre 2026.');
  });

  it('counts what is left in stock', () => {
    expect(
      plain(
        apiErrorMessage(refusal(400, 'raw_stock_too_low', { available: 39999, quantity: 40000 })),
      ),
    ).toBe('Il ne reste que 39 999 briques crues en stock, impossible d’en enfourner 40 000.');
    expect(
      plain(
        apiErrorMessage(refusal(400, 'fired_stock_too_low', { available: 2499, quantity: 2500 })),
      ),
    ).toBe('Il ne reste que 2 499 briques cuites en stock, impossible d’en livrer 2 500.');
  });

  it('agrees the sentence with the number of things holding the row', () => {
    expect(apiErrorMessage(refusal(409, 'sale_has_deliveries', { deliveries: 1 }))).toBe(
      'Cette vente porte encore 1 voyage : annulez-la d’abord.',
    );
    expect(apiErrorMessage(refusal(409, 'kiln_batch_has_works', { works: 3 }))).toBe(
      'Ce lot porte encore 3 prestations : annulez-les d’abord.',
    );
  });

  it('still reads when the numbers the sentence wanted are missing', () => {
    expect(apiErrorMessage(refusal(409, 'campaign_year_tranche_taken'))).toBe(
      'Cette tranche existe déjà pour cette année.',
    );
    expect(apiErrorMessage(refusal(400, 'raw_stock_too_low'))).toBe(
      'Le stock de briques crues ne couvre pas cette saisie.',
    );
  });

  it('hides nothing when the answer carries no code this build knows', () => {
    expect(apiErrorMessage(new ApiError(400, { message: 'English, for the logs' }))).toBe(
      'English, for the logs',
    );
  });

  it('blames the network when the call never reached the API', () => {
    expect(apiErrorMessage(new TypeError('Failed to fetch'))).toBe('Serveur injoignable.');
  });
});
