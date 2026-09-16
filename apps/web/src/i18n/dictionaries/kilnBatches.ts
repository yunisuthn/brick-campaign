/** The Lots de cuisson screens: the list, the entry form, and the correction/cancel page. */
export const fr = {
  'kilnBatches.title': 'Lots de cuisson',
  'kilnBatches.newLink': 'Enfourner un lot',
  'kilnBatches.noCampaignSuffix': ' avant d’enfourner.',

  'kilnBatches.noneAtAll': 'Aucun lot enfourné.',
  'kilnBatches.allBatches': 'Tous les lots',
  'kilnBatches.notFound': 'Lot introuvable.',
  'kilnBatches.noCampaignShort': 'Aucune campagne.',

  'kilnBatches.loadedOnMessage': 'Enfourné le {date}',
  'kilnBatches.stillInKiln': 'encore au four',
  'kilnBatches.unloadedOnMessage': 'défourné le {date}',
  'kilnBatches.costLabel': 'Coût :',
  'kilnBatches.rateToFix': 'tarif de prestation à fixer',

  'kilnBatches.newTitle': 'Enfourner un lot',
  'kilnBatches.rawStock': 'Stock crue : {quantity}.',
  'kilnBatches.loadedOnLabel': 'Date d’enfournement',
  'kilnBatches.loadedOnRequired': 'La date d’enfournement est requise.',
  'kilnBatches.unloadedOnLabel': 'Date de défournement',
  'kilnBatches.unloadedOnHint': 'Laissée vide tant que le lot est au four.',
  'kilnBatches.quantityLabel': 'Quantité (briques)',
  'kilnBatches.quantityRequired': 'Un lot est de {min} briques au minimum.',
  'kilnBatches.loadFailedAction': 'Enfournement impossible :',
  'kilnBatches.loadAction': 'Enfourner',

  'kilnBatches.keepBatch': 'Garder le lot',
  'kilnBatches.cancelBatch': 'Annuler le lot',

  'kilnBatches.costSectionLabel': 'Coût du lot',
  'kilnBatches.expensesLabel': 'Dépenses',
  'kilnBatches.labourLabel': 'Main-d’œuvre',
  'kilnBatches.totalLabel': 'Total',
  'kilnBatches.rateToFixShort': 'Tarif à fixer',
} as const;

export const mg: Record<keyof typeof fr, string> = {
  'kilnBatches.title': 'Fandoroana',
  'kilnBatches.newLink': 'Ampidiro biriky ao am-patana',
  'kilnBatches.noCampaignSuffix': ' alohan’ny hampidirana biriky ao am-patana.',

  'kilnBatches.noneAtAll': 'Tsy mbola misy fandoroana voarakitra.',
  'kilnBatches.allBatches': 'Fandoroana rehetra',
  'kilnBatches.notFound': 'Tsy hita ilay fandoroana.',
  'kilnBatches.noCampaignShort': 'Tsy misy vanim-potoana.',

  'kilnBatches.loadedOnMessage': 'Nampidirina ny {date}',
  'kilnBatches.stillInKiln': 'mbola ao am-patana',
  'kilnBatches.unloadedOnMessage': 'navoaka ny {date}',
  'kilnBatches.costLabel': 'Vidiny :',
  'kilnBatches.rateToFix': 'mbola hofaritana ny tarifin’ny asa',

  'kilnBatches.newTitle': 'Ampidiro biriky ao am-patana',
  'kilnBatches.rawStock': 'Biriky manta ao am-bahoaka : {quantity}.',
  'kilnBatches.loadedOnLabel': 'Daty nampidirana ao am-patana',
  'kilnBatches.loadedOnRequired': 'Ilaina ny daty nampidirana ao am-patana.',
  'kilnBatches.unloadedOnLabel': 'Daty namoahana ao am-patana',
  'kilnBatches.unloadedOnHint': 'Avela ho banga raha mbola ao am-patana ilay fandoroana.',
  'kilnBatches.quantityLabel': 'Isa (biriky)',
  'kilnBatches.quantityRequired': 'Ilaina farafahakeliny biriky {min} isaky ny fandoroana.',
  'kilnBatches.loadFailedAction': 'Tsy voatarika ny fampidirana :',
  'kilnBatches.loadAction': 'Ampidiro',

  'kilnBatches.keepBatch': 'Tazomy ny fandoroana',
  'kilnBatches.cancelBatch': 'Foano ny fandoroana',

  'kilnBatches.costSectionLabel': 'Vidin’ny fandoroana',
  'kilnBatches.expensesLabel': 'Fandaniana',
  'kilnBatches.labourLabel': 'Asa',
  'kilnBatches.totalLabel': 'Fitambarana',
  'kilnBatches.rateToFixShort': 'Mbola hofaritana',
};
