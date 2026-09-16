/** The Dépenses screens: the list, the entry form, the correction/cancel page, and a rice field's cost. */
export const fr = {
  'expenses.title': 'Dépenses',
  'expenses.newTitle': 'Nouvelle dépense',
  'expenses.allExpenses': 'Toutes les dépenses',
  'expenses.newLink': 'Saisir une dépense',
  'expenses.noCampaignSuffix': ' avant de saisir une dépense.',

  'expenses.noneAtAll': 'Aucune dépense saisie.',
  'expenses.noneForCategory': 'Aucune dépense dans cette catégorie.',
  'expenses.notFound': 'Dépense introuvable.',

  'expenses.categoryLabel': 'Catégorie',
  'expenses.allCategories': 'Toutes',
  'expenses.category.riceField': 'Rizière',
  'expenses.category.akofa': 'Akofa',
  'expenses.category.taiCharbon': 'Tai-charbon',
  'expenses.category.fuel': 'Carburant',
  'expenses.category.repair': 'Réparation',
  'expenses.category.food': 'Nourriture',
  'expenses.category.other': 'Autre',

  'expenses.totalLabel': 'Total :',

  'expenses.amountLabel': 'Montant (Ar)',
  'expenses.labelLabel': 'Libellé',
  'expenses.labelRequired': 'Le libellé est requis.',
  'expenses.riceFieldLabel': 'Rizière (facultatif)',
  'expenses.noneOption': 'Aucun',
  'expenses.kilnBatchLabel': 'Lot (facultatif)',
  'expenses.kilnBatchOption': 'Lot du {date} · {quantity} briques',

  'expenses.keepExpense': 'Garder la dépense',
  'expenses.cancelExpense': 'Annuler la dépense',

  'expenses.costOnCampaign': 'Coût sur la campagne',
  'expenses.noneForRiceField': 'Aucune dépense rattachée à cette rizière.',
  'expenses.addForRiceField': 'Saisir une dépense pour cette rizière',
} as const;

export const mg: Record<keyof typeof fr, string> = {
  'expenses.title': 'Fandaniana',
  'expenses.newTitle': 'Fandaniana vaovao',
  'expenses.allExpenses': 'Fandaniana rehetra',
  'expenses.newLink': 'Ampidiro ny fandaniana',
  'expenses.noCampaignSuffix': ' alohan’ny hampidirana fandaniana.',

  'expenses.noneAtAll': 'Tsy mbola misy fandaniana voarakitra.',
  'expenses.noneForCategory': 'Tsy misy fandaniana amin’ity sokajy ity.',
  'expenses.notFound': 'Tsy hita ilay fandaniana.',

  'expenses.categoryLabel': 'Sokajy',
  'expenses.allCategories': 'Rehetra',
  'expenses.category.riceField': 'Tanimbary',
  'expenses.category.akofa': 'Akofa',
  'expenses.category.taiCharbon': 'Tai-charbon',
  'expenses.category.fuel': 'Solika',
  'expenses.category.repair': 'Fanamboarana',
  'expenses.category.food': 'Sakafo',
  'expenses.category.other': 'Hafa',

  'expenses.totalLabel': 'Fitambarana :',

  'expenses.amountLabel': 'Vola (Ar)',
  'expenses.labelLabel': 'Anarana',
  'expenses.labelRequired': 'Ilaina ny anarana.',
  'expenses.riceFieldLabel': 'Tanimbary (tsy voatery)',
  'expenses.noneOption': 'Tsy misy',
  'expenses.kilnBatchLabel': 'Fandoroana (tsy voatery)',
  'expenses.kilnBatchOption': 'Fandoroana ny {date} · biriky {quantity}',

  'expenses.keepExpense': 'Tazomy ny fandaniana',
  'expenses.cancelExpense': 'Foano ny fandaniana',

  'expenses.costOnCampaign': 'Vidiny amin’ny vanim-potoana',
  'expenses.noneForRiceField': 'Tsy misy fandaniana mifandray amin’ity tanimbary ity.',
  'expenses.addForRiceField': 'Ampidiro ny fandaniana ho an’ity tanimbary ity',
};
