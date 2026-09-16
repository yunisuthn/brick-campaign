/** The Tableau de bord page, and the Stock summary card it (and other pages) embed. */
export const fr = {
  'dashboard.title': 'Tableau de bord',
  'dashboard.noCampaignSuffix': ' pour suivre la saison.',

  'dashboard.resultLabel': 'Résultat',
  'dashboard.resultCaption': 'Résultat de la campagne',
  'dashboard.resultUnknown': 'Inconnu tant qu’un tarif n’est pas fixé',

  'dashboard.salesLabel': 'Ventes',
  'dashboard.revenue': 'Chiffre d’affaires',
  'dashboard.received': 'Encaissé',
  'dashboard.outstandingReceivable': 'Reste à encaisser',

  'dashboard.labourLabel': 'Main-d’œuvre',
  'dashboard.moulding': 'Moulage',
  'dashboard.transport': 'Transport',
  'dashboard.kilnLoading': 'Enfournement',
  'dashboard.totalDue': 'Total dû',
  'dashboard.paid': 'Versé',
  'dashboard.outstandingPayable': 'Reste à verser',

  'dashboard.expensesLabel': 'Dépenses',
  'dashboard.total': 'Total',
  'dashboard.deliveries': 'Livraisons',

  'dashboard.rateToFix': 'Tarif à fixer',

  'dashboard.stock.label': 'Stock',
  'dashboard.stock.raw': 'Crue',
  'dashboard.stock.inKiln': 'Au four',
  'dashboard.stock.fired': 'Cuite',
} as const;

export const mg: Record<keyof typeof fr, string> = {
  'dashboard.title': 'Fitambarana',
  'dashboard.noCampaignSuffix': ' mba hanarahana ny vanim-potoana.',

  'dashboard.resultLabel': 'Vokatra',
  'dashboard.resultCaption': 'Vokatry ny vanim-potoana',
  'dashboard.resultUnknown': 'Tsy fantatra raha mbola tsy voafaritra ny tarify',

  'dashboard.salesLabel': 'Varotra',
  'dashboard.revenue': 'Vola miditra',
  'dashboard.received': 'Voaray',
  'dashboard.outstandingReceivable': 'Mbola horaisina',

  'dashboard.labourLabel': 'Asa',
  'dashboard.moulding': 'Fanaovana biriky',
  'dashboard.transport': 'Fitaterana',
  'dashboard.kilnLoading': 'Fampidirana ao am-patana',
  'dashboard.totalDue': 'Fitambaran’ny tokony aloa',
  'dashboard.paid': 'Voaloa',
  'dashboard.outstandingPayable': 'Mbola haloa',

  'dashboard.expensesLabel': 'Fandaniana',
  'dashboard.total': 'Fitambarana',
  'dashboard.deliveries': 'Fitaterana entana',

  'dashboard.rateToFix': 'Mbola hofaritana',

  'dashboard.stock.label': 'Akora',
  'dashboard.stock.raw': 'Manta',
  'dashboard.stock.inKiln': 'Ao am-patana',
  'dashboard.stock.fired': 'Masaka',
};
