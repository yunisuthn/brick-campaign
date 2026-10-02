import { dictionary } from '../i18n/translations.js';
import { ApiError } from './client.js';
import { loadErrorMessage } from './loadError.js';

const inLanguage = (lang: 'fr' | 'mg') => (key: 'common.loadFailedPrefix') => dictionary[lang][key];

describe('loadErrorMessage', () => {
  it('says the record is not found on a 404, in the words of the screen', () => {
    const error = new ApiError(404, { message: 'Sale s1 not found' });
    expect(loadErrorMessage(error, 'Vente introuvable.', inLanguage('fr'))).toBe(
      'Vente introuvable.',
    );
  });

  it('puts any other failure behind the prefix of the interface language', () => {
    const error = new ApiError(503, { message: 'database down' });
    expect(loadErrorMessage(error, 'Vente introuvable.', inLanguage('mg'))).toBe(
      'Tsy voatarika ny fakana angona : database down',
    );
  });
});
