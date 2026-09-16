/** The Versements screens: the list, the entry form, and the correction/cancel page. */
export const fr = {
  'payments.title': 'Versements',
  'payments.newTitle': 'Nouveau versement',
  'payments.allPayments': 'Tous les versements',
  'payments.newLink': 'Saisir un versement',
  'payments.noCampaignSuffix': ' avant de saisir un versement.',

  'payments.noneAtAll': 'Aucun versement saisi.',
  'payments.noneForFilters': 'Aucun versement pour ces critères.',
  'payments.notFound': 'Versement introuvable.',

  'payments.unknownBeneficiary': 'Bénéficiaire inconnu',

  'payments.row.confirmDelete': 'Confirmer la suppression',

  'payments.contractorLabel': 'Prestataire',
  'payments.beneficiaryLabel': 'Bénéficiaire',
  'payments.contractorNameLabel': 'Nom du prestataire',
  'payments.contractorNameRequired': 'Le nom du prestataire est requis.',
  'payments.amountLabel': 'Montant (Ar)',

  'payments.type.vatsy': 'Vatsy',
  'payments.type.advance': 'Avance',
  'payments.type.settlement': 'Solde',

  'payments.keepPayment': 'Garder le versement',
  'payments.cancelPayment': 'Annuler le versement',
  'payments.savedMessage': 'Enregistré : {name}, {amount}.',
} as const;

export const mg: Record<keyof typeof fr, string> = {
  'payments.title': 'Fandoavam-bola',
  'payments.newTitle': 'Fandoavam-bola vaovao',
  'payments.allPayments': 'Fandoavam-bola rehetra',
  'payments.newLink': 'Ampidiro ny fandoavam-bola',
  'payments.noCampaignSuffix': ' alohan’ny hampidirana fandoavam-bola.',

  'payments.noneAtAll': 'Tsy mbola misy fandoavam-bola voarakitra.',
  'payments.noneForFilters': 'Tsy misy fandoavam-bola mifanaraka amin’ny fisivanana.',
  'payments.notFound': 'Tsy hita ilay fandoavam-bola.',

  'payments.unknownBeneficiary': 'Mpandray tsy fantatra',

  'payments.row.confirmDelete': 'Hamarino ny famafana',

  'payments.contractorLabel': 'Mpanao asa',
  'payments.beneficiaryLabel': 'Mpandray',
  'payments.contractorNameLabel': 'Anaran’ny mpanao asa',
  'payments.contractorNameRequired': 'Ilaina ny anaran’ny mpanao asa.',
  'payments.amountLabel': 'Vola (Ar)',

  'payments.type.vatsy': 'Vatsy',
  'payments.type.advance': 'Zotra',
  'payments.type.settlement': 'Sisa aloa',

  'payments.keepPayment': 'Tazomy ny fandoavam-bola',
  'payments.cancelPayment': 'Foano ny fandoavam-bola',
  'payments.savedMessage': 'Voarakitra : {name}, {amount}.',
};
