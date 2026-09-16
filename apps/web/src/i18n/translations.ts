import * as balances from './dictionaries/balances.js';
import * as campaigns from './dictionaries/campaigns.js';
import * as clients from './dictionaries/clients.js';
import * as common from './dictionaries/common.js';
import * as contractorWorks from './dictionaries/contractorWorks.js';
import * as dashboard from './dictionaries/dashboard.js';
import * as deliveries from './dictionaries/deliveries.js';
import * as expenses from './dictionaries/expenses.js';
import * as kilnBatches from './dictionaries/kilnBatches.js';
import * as more from './dictionaries/more.js';
import * as moulders from './dictionaries/moulders.js';
import * as payments from './dictionaries/payments.js';
import * as productions from './dictionaries/productions.js';
import * as riceFields from './dictionaries/riceFields.js';
import * as salePayments from './dictionaries/salePayments.js';
import * as sales from './dictionaries/sales.js';
import * as session from './dictionaries/session.js';

/**
 * One dictionary per screen or feature (see ./dictionaries), merged here. Each dictionary
 * checks its own `mg` against its own `fr` keys at compile time (`Record<keyof typeof fr,
 * string>`), so nothing needs re-checking once merged — this file only needs to make sure every
 * dictionary that exists gets included. Every domain file exists from the start (even empty),
 * so this list itself never needs touching when a domain's translations are filled in.
 */
export const dictionary = {
  fr: {
    ...common.fr,
    ...payments.fr,
    ...productions.fr,
    ...campaigns.fr,
    ...moulders.fr,
    ...riceFields.fr,
    ...clients.fr,
    ...sales.fr,
    ...deliveries.fr,
    ...salePayments.fr,
    ...expenses.fr,
    ...kilnBatches.fr,
    ...contractorWorks.fr,
    ...balances.fr,
    ...dashboard.fr,
    ...more.fr,
    ...session.fr,
  },
  mg: {
    ...common.mg,
    ...payments.mg,
    ...productions.mg,
    ...campaigns.mg,
    ...moulders.mg,
    ...riceFields.mg,
    ...clients.mg,
    ...sales.mg,
    ...deliveries.mg,
    ...salePayments.mg,
    ...expenses.mg,
    ...kilnBatches.mg,
    ...contractorWorks.mg,
    ...balances.mg,
    ...dashboard.mg,
    ...more.mg,
    ...session.mg,
  },
};

export type TranslationKey = keyof typeof dictionary.fr;
