/** The Soldes page: two sections, moulders and contractors, each a list of balance cards. */
export const fr = {
  'balances.title': 'Soldes',
  'balances.noCampaignSuffix': ' pour suivre les soldes.',

  'balances.mouldersTitle': 'Mouleurs',
  'balances.mouldersNone': 'Aucun mouleur avec une saisie sur cette campagne.',
  'balances.mouldingRateToFix': 'Tarif de moulage à fixer',

  'balances.contractorsTitle': 'Prestataires',
  'balances.contractorsNone': 'Aucune prestation ni versement sur cette campagne.',
  'balances.contractorRateToFix': 'Tarif de prestation à fixer',

  'balances.bricksTransported': '{quantity} transportées',
  'balances.bricksLoaded': '{quantity} enfournées',
  'balances.noWork': 'Aucune prestation',

  'balances.earned': 'Gagné',
  'balances.paid': 'Versé',
  'balances.overpaid': 'Trop versé',
  'balances.due': 'Reste dû',
  'balances.unknownUntilRate': 'Inconnu tant que le tarif n’est pas fixé',
} as const;

export const mg: Record<keyof typeof fr, string> = {
  'balances.title': 'Sisa tavela',
  'balances.noCampaignSuffix': ' mba hanarahana ny sisa tavela.',

  'balances.mouldersTitle': 'Mpanao biriky',
  'balances.mouldersNone': 'Tsy misy mpanao biriky nanao fidirana tamin’ity vanim-potoana ity.',
  'balances.mouldingRateToFix': 'Mbola hofaritana ny tarifin’ny fanaovana biriky',

  'balances.contractorsTitle': 'Mpanao asa',
  'balances.contractorsNone': 'Tsy misy asa na fandoavam-bola tamin’ity vanim-potoana ity.',
  'balances.contractorRateToFix': 'Mbola hofaritana ny tarifin’ny asa',

  'balances.bricksTransported': '{quantity} nentina',
  'balances.bricksLoaded': '{quantity} nampidirina',
  'balances.noWork': 'Tsy misy asa',

  'balances.earned': 'Azo',
  'balances.paid': 'Voaloa',
  'balances.overpaid': 'Nihoa-pandoa',
  'balances.due': 'Sisa tavela',
  'balances.unknownUntilRate': 'Tsy fantatra raha mbola tsy voafaritra ny tarify',
};
