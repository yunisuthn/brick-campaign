/** The Productions screens: the list, the entry form, and the correction/cancel page. */
export const fr = {
  'productions.title': 'Productions',
  'productions.newTitle': 'Nouvelle production',
  'productions.allProductions': 'Toutes les productions',
  'productions.newLink': 'Saisir une production',
  'productions.noCampaignSuffix': ' avant de saisir une production.',

  'productions.noneAtAll': 'Aucune production saisie.',
  'productions.noneForFilters': 'Aucune production pour ces critères.',
  'productions.notFound': 'Saisie introuvable.',

  'productions.unknownRiceField': 'Rizière inconnue',

  'productions.startedOnLabel': 'Date de début',
  'productions.startedOnRequired': 'La date de début est requise.',
  'productions.endedOnLabel': 'Date de fin',
  'productions.endedOnHint': 'Laissée vide tant que le travail n’est pas terminé.',
  'productions.riceFieldLabel': 'Rizière',
  'productions.riceFieldRequired': 'La rizière est requise.',
  'productions.quantityLabel': 'Quantité (briques)',
  'productions.quantityRequired': 'Un nombre entier de briques est attendu.',
  'productions.rateLabel': 'Tarif de moulage',
  'productions.rateToFix': 'À fixer',
  'productions.rateOption': '{rate} Ar la brique',

  'productions.savedMessage': 'Enregistré : {name}, {quantity}.',
  'productions.keepEntry': 'Garder la saisie',
  'productions.cancelEntry': 'Annuler la saisie',
} as const;

export const mg: Record<keyof typeof fr, string> = {
  'productions.title': 'Famokarana',
  'productions.newTitle': 'Famokarana vaovao',
  'productions.allProductions': 'Famokarana rehetra',
  'productions.newLink': 'Ampidiro ny famokarana',
  'productions.noCampaignSuffix': ' alohan’ny hampidirana famokarana.',

  'productions.noneAtAll': 'Tsy mbola misy famokarana voarakitra.',
  'productions.noneForFilters': 'Tsy misy famokarana mifanaraka amin’ny fisivanana.',
  'productions.notFound': 'Tsy hita ilay fidirana.',

  'productions.unknownRiceField': 'Tanimbary tsy fantatra',

  'productions.startedOnLabel': 'Daty nanombohana',
  'productions.startedOnRequired': 'Ilaina ny daty nanombohana.',
  'productions.endedOnLabel': 'Daty nifaranana',
  'productions.endedOnHint': 'Avela ho banga raha mbola tsy vita ny asa.',
  'productions.riceFieldLabel': 'Tanimbary',
  'productions.riceFieldRequired': 'Ilaina ny tanimbary.',
  'productions.quantityLabel': 'Isa (biriky)',
  'productions.quantityRequired': 'Ilaina ny isa manontolo biriky.',
  'productions.rateLabel': 'Tarifin’ny fanaovana biriky',
  'productions.rateToFix': 'Mbola hofaritana',
  'productions.rateOption': '{rate} Ar isaky ny biriky',

  'productions.savedMessage': 'Voarakitra : {name}, {quantity}.',
  'productions.keepEntry': 'Tazomy ny fidirana',
  'productions.cancelEntry': 'Foano ny fidirana',
};
