/** The Mouleurs screens: the list, the detail/edit form, and the creation form. */
export const fr = {
  'moulders.title': 'Mouleurs',
  'moulders.newLink': 'Nouveau mouleur',
  'moulders.showRetired': 'Afficher les mouleurs retirés',
  'moulders.none': 'Aucun mouleur.',
  'moulders.notFound': 'Mouleur introuvable.',
  'moulders.allMoulders': 'Tous les mouleurs',
  'moulders.retiredSuffix': ' · retiré',

  'moulders.member': '1 membre',
  'moulders.members': '{count} membres',

  'moulders.retireMoulder': 'Retirer le mouleur',
  'moulders.reactivateMoulder': 'Réactiver le mouleur',

  'moulders.nameLabel': 'Nom du responsable',
  'moulders.nameRequired': 'Le nom est requis.',
  'moulders.memberCountLabel': 'Nombre de membres',
  'moulders.memberCountRequired': 'Un nombre entre 1 et 20 est attendu.',

  'moulders.createFailedPrefix': 'Création impossible :',
  'moulders.createButton': 'Créer le mouleur',
  'moulders.newTitle': 'Nouveau mouleur',

  'moulders.balanceOnCampaign': 'Versements sur la campagne',
  'moulders.noEntriesOnCampaign': 'Aucune saisie sur cette campagne.',
} as const;

export const mg: Record<keyof typeof fr, string> = {
  'moulders.title': 'Mpanao biriky',
  'moulders.newLink': 'Mpanao biriky vaovao',
  'moulders.showRetired': 'Asehoy ny mpanao biriky efa niala',
  'moulders.none': 'Tsy misy mpanao biriky.',
  'moulders.notFound': 'Tsy hita ilay mpanao biriky.',
  'moulders.allMoulders': 'Mpanao biriky rehetra',
  'moulders.retiredSuffix': ' · efa niala',

  'moulders.member': 'mpikambana 1',
  'moulders.members': 'mpikambana {count}',

  'moulders.retireMoulder': 'Esory amin’ny asa ilay mpanao biriky',
  'moulders.reactivateMoulder': 'Ampandehano indray ilay mpanao biriky',

  'moulders.nameLabel': 'Anaran’ny tompon’andraikitra',
  'moulders.nameRequired': 'Ilaina ny anarana.',
  'moulders.memberCountLabel': 'Isan’ny mpikambana',
  'moulders.memberCountRequired': 'Ilaina ny isa eo anelanelan’ny 1 sy 20.',

  'moulders.createFailedPrefix': 'Tsy voaforona :',
  'moulders.createButton': 'Forony ilay mpanao biriky',
  'moulders.newTitle': 'Mpanao biriky vaovao',

  'moulders.balanceOnCampaign': 'Fandoavam-bola amin’ny vanim-potoana',
  'moulders.noEntriesOnCampaign': 'Tsy misy fidirana tamin’ity vanim-potoana ity.',
};
