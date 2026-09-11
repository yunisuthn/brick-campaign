import type { ErrorCode, ErrorDetails } from 'contracts';
import { formatAmount, formatCount, formatDate } from '../format.js';
import { ApiError } from './client.js';

type Sentence = string | ((details: ErrorDetails) => string);

/**
 * One French sentence per refusal the API can send. The table is typed against the contract, so
 * a code added on the API side without a sentence here stops the build (reference document,
 * section 10.1) instead of showing an English phrase to the person entering the day’s work.
 */
const sentences: Record<ErrorCode, Sentence> = {
  validation_failed: 'La saisie est incomplète ou mal formée.',

  campaign_dates_out_of_order: 'La clôture ne peut pas précéder le début de la campagne.',
  batch_dates_out_of_order: 'Le défournement ne peut pas précéder l’enfournement.',
  date_outside_campaign: (details) => {
    const startedOn = dateOf(details, 'startedOn');
    const closedOn = dateOf(details, 'closedOn');
    if (startedOn === null) return 'La date doit tomber dans la campagne.';
    return closedOn === null
      ? `La date doit tomber dans la campagne, donc à partir du ${startedOn}.`
      : `La date doit tomber dans la campagne, entre le ${startedOn} et le ${closedOn}.`;
  },
  delivery_before_sale: 'Un voyage ne peut pas précéder la vente qu’il livre.',
  sale_payment_before_sale: 'Le paiement ne peut pas précéder la vente.',

  unknown_moulder: 'Ce mouleur n’existe plus.',
  unknown_rice_field: 'Cette rizière n’existe plus.',
  unknown_client: 'Ce client n’existe plus.',
  unknown_kiln_batch: 'Ce lot n’existe pas dans cette campagne.',
  moulder_inactive: 'Ce mouleur est retiré : plus aucune saisie à son nom.',

  raw_stock_too_low: stockSentence('crues', 'impossible d’en enfourner'),
  fired_stock_too_low: stockSentence('cuites', 'impossible d’en livrer'),
  sale_overpaid: (details) => {
    const remaining = numberOf(details, 'remaining');
    if (remaining === null) return 'Cet encaissement dépasse ce qui reste à payer.';
    return remaining === 0
      ? 'Cette vente est déjà payée en entier.'
      : `Il ne reste que ${formatAmount(remaining)} à encaisser sur cette vente.`;
  },

  session_required: 'Session expirée, reconnectez-vous.',
  invalid_credentials: 'Adresse ou mot de passe incorrect.',

  campaign_not_found: 'Cette campagne n’existe plus.',
  moulder_not_found: 'Ce mouleur n’existe plus.',
  contractor_not_found: 'Aucune prestation ni versement à ce nom dans la campagne.',
  rice_field_not_found: 'Cette rizière n’existe plus.',
  client_not_found: 'Ce client n’existe plus.',
  production_not_found: 'Cette saisie n’existe plus.',
  payment_not_found: 'Ce versement n’existe plus.',
  kiln_batch_not_found: 'Ce lot n’existe plus.',
  contractor_work_not_found: 'Cette prestation n’existe plus.',
  sale_not_found: 'Cette vente n’existe plus.',
  delivery_not_found: 'Ce voyage n’existe plus.',
  sale_payment_not_found: 'Cet encaissement n’existe plus.',
  expense_not_found: 'Cette dépense n’existe plus.',

  campaign_year_taken: (details) => {
    const year = numberOf(details, 'year');
    return year === null
      ? 'Une campagne existe déjà pour cette année.'
      : `Une campagne existe déjà pour ${year}.`;
  },
  kiln_batch_has_works: (details) =>
    holdSentence(numberOf(details, 'works'), 'prestation', 'prestations', 'Ce lot porte encore'),
  sale_has_deliveries: (details) =>
    holdSentence(numberOf(details, 'deliveries'), 'voyage', 'voyages', 'Cette vente porte encore'),
  sale_has_payments: (details) =>
    holdSentence(
      numberOf(details, 'payments'),
      'encaissement',
      'encaissements',
      'Cette vente porte encore',
    ),
};

/**
 * What went wrong, in the words of the interface. A call that never reached the API says so; a
 * refusal the client could not read a known code from keeps the API message rather than hiding
 * behind a vague sentence.
 */
export function apiErrorMessage(error: Error): string {
  if (!(error instanceof ApiError)) return 'Serveur injoignable.';
  if (error.code === undefined) return error.message;
  const sentence = sentences[error.code];
  return typeof sentence === 'string' ? sentence : sentence(error.details ?? {});
}

function stockSentence(state: string, verb: string): Sentence {
  return (details) => {
    const available = numberOf(details, 'available');
    const quantity = numberOf(details, 'quantity');
    if (available === null || quantity === null) {
      return `Le stock de briques ${state} ne couvre pas cette saisie.`;
    }
    return `Il ne reste que ${formatCount(available)} briques ${state} en stock, ${verb} ${formatCount(quantity)}.`;
  };
}

function holdSentence(count: number | null, one: string, many: string, lead: string): string {
  if (count === null) return `${lead} des entrées : annulez-les d’abord.`;
  return `${lead} ${formatCount(count)} ${count === 1 ? one : many} : annulez-${count === 1 ? 'la' : 'les'} d’abord.`;
}

function numberOf(details: ErrorDetails, key: string): number | null {
  const value = details[key];
  return typeof value === 'number' ? value : null;
}

function dateOf(details: ErrorDetails, key: string): string | null {
  const value = details[key];
  return typeof value === 'string' ? formatDate(value) : null;
}
