/** The Prestations screens: the batch's work list, the entry form, and the correction/cancel page. */
export const fr = {
  'contractorWorks.noCampaignShort': 'Aucune campagne.',
  'contractorWorks.notFound': 'Prestation introuvable.',

  'contractorWorks.backToBatch': 'Retour au lot',
  'contractorWorks.newTitle': 'Nouvelle prestation',

  'contractorWorks.type.transport': 'Transport vers le four',
  'contractorWorks.type.kiln_loading': 'Enfournement',

  'contractorWorks.keepWork': 'Garder la prestation',
  'contractorWorks.cancelWork': 'Annuler la prestation',

  'contractorWorks.sectionTitle': 'Prestations',
  'contractorWorks.addLink': 'Ajouter une prestation',
  'contractorWorks.noneAtAll': 'Aucune prestation sur ce lot.',

  'contractorWorks.typeLabel': 'Type de prestation',
  'contractorWorks.contractorNameLabel': 'Nom du prestataire',
  'contractorWorks.contractorNameRequired': 'Le nom du prestataire est requis.',
  'contractorWorks.quantityLabel': 'Quantité (briques)',
  'contractorWorks.quantityRequired': 'Un nombre entier de briques est attendu.',
  'contractorWorks.rateLabel': 'Tarif de transport',
  'contractorWorks.rateToFix': 'À fixer',
  'contractorWorks.rateOption': '{rate} Ar la brique',
} as const;

export const mg: Record<keyof typeof fr, string> = {
  'contractorWorks.noCampaignShort': 'Tsy misy vanim-potoana.',
  'contractorWorks.notFound': 'Tsy hita ilay asa.',

  'contractorWorks.backToBatch': 'Hiverina any amin’ny fandoroana',
  'contractorWorks.newTitle': 'Asa vaovao',

  'contractorWorks.type.transport': 'Fitaterana ho any am-patana',
  'contractorWorks.type.kiln_loading': 'Fampidirana ao am-patana',

  'contractorWorks.keepWork': 'Tazomy ny asa',
  'contractorWorks.cancelWork': 'Foano ny asa',

  'contractorWorks.sectionTitle': 'Asa',
  'contractorWorks.addLink': 'Ampio asa iray',
  'contractorWorks.noneAtAll': 'Tsy misy asa amin’ity fandoroana ity.',

  'contractorWorks.typeLabel': 'Karazan’asa',
  'contractorWorks.contractorNameLabel': 'Anaran’ny mpanao asa',
  'contractorWorks.contractorNameRequired': 'Ilaina ny anaran’ny mpanao asa.',
  'contractorWorks.quantityLabel': 'Isa (biriky)',
  'contractorWorks.quantityRequired': 'Ilaina ny isa manontolo biriky.',
  'contractorWorks.rateLabel': 'Tarifin’ny fitaterana',
  'contractorWorks.rateToFix': 'Mbola hofaritana',
  'contractorWorks.rateOption': '{rate} Ar isaky ny biriky',
};
