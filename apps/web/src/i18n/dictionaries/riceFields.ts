/** The Rizières screens: the list, the detail/edit form, and the creation form. */
export const fr = {
  'riceFields.title': 'Rizières',
  'riceFields.newLink': 'Nouvelle rizière',
  'riceFields.none': 'Aucune rizière.',
  'riceFields.notFound': 'Rizière introuvable.',
  'riceFields.allRiceFields': 'Toutes les rizières',
  'riceFields.contractPrefix': 'contrat',

  'riceFields.surfaceUnspecified': 'Surface non précisée',
  'riceFields.surfaceValue': '{surface} m²',

  'riceFields.contract.durable': 'Durable',
  'riceFields.contract.seasonal': 'De campagne',

  'riceFields.nameLabel': 'Nom',
  'riceFields.nameRequired': 'Le nom est requis.',
  'riceFields.locationLabel': 'Localisation',
  'riceFields.locationRequired': 'La localisation est requise.',
  'riceFields.surfaceLabel': 'Surface (m²)',
  'riceFields.surfaceInvalid': 'Un nombre entier de mètres carrés est attendu, ou rien.',
  'riceFields.contractTypeLabel': 'Type de contrat',

  'riceFields.createFailedPrefix': 'Création impossible :',
  'riceFields.createButton': 'Créer la rizière',
  'riceFields.newTitle': 'Nouvelle rizière',
} as const;

export const mg: Record<keyof typeof fr, string> = {
  'riceFields.title': 'Tanimbary',
  'riceFields.newLink': 'Tanimbary vaovao',
  'riceFields.none': 'Tsy misy tanimbary.',
  'riceFields.notFound': 'Tsy hita ilay tanimbary.',
  'riceFields.allRiceFields': 'Tanimbary rehetra',
  'riceFields.contractPrefix': 'fifanarahana',

  'riceFields.surfaceUnspecified': 'Tsy voafaritra ny velarana',
  'riceFields.surfaceValue': '{surface} m²',

  'riceFields.contract.durable': 'Maharitra',
  'riceFields.contract.seasonal': 'Isam-banim-potoana',

  'riceFields.nameLabel': 'Anarana',
  'riceFields.nameRequired': 'Ilaina ny anarana.',
  'riceFields.locationLabel': 'Toerana',
  'riceFields.locationRequired': 'Ilaina ny toerana.',
  'riceFields.surfaceLabel': 'Velarana (m²)',
  'riceFields.surfaceInvalid': 'Ilaina ny isa manontolo metatra toradroa, na avelao ho banga.',
  'riceFields.contractTypeLabel': 'Karazam-pifanarahana',

  'riceFields.createFailedPrefix': 'Tsy voaforona :',
  'riceFields.createButton': 'Forony ilay tanimbary',
  'riceFields.newTitle': 'Tanimbary vaovao',
};
