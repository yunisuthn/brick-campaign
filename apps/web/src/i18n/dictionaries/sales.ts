/** The Ventes screens: the list, the entry form, and the correction/cancel page. */
export const fr = {
  'sales.title': 'Ventes',
  'sales.newTitle': 'Nouvelle vente',
  'sales.allSales': 'Toutes les ventes',
  'sales.newLink': 'Enregistrer une vente',
  'sales.noCampaignSuffix': ' avant d’enregistrer une vente.',

  'sales.noneAtAll': 'Aucune vente enregistrée.',
  'sales.notFound': 'Vente introuvable.',

  'sales.unknownClient': 'Client inconnu',

  'sales.status.ordered': 'Commandée',
  'sales.status.delivered': 'Livrée',
  'sales.status.partiallyPaid': 'Partiellement payée',
  'sales.status.paid': 'Payée',

  'sales.progressComplete': '{quantity} livrées',
  'sales.progressPartial': '{delivered} / {ordered}',
  'sales.deliveredOfOrdered': '{delivered} livrées sur {ordered}',

  'sales.clientLabel': 'Client',
  'sales.clientRequired': 'Le client est requis.',
  'sales.orderedQuantityLabel': 'Quantité commandée (briques)',
  'sales.quantityRequired': 'Un nombre entier de briques est attendu.',
  'sales.unitPriceLabel': 'Prix unitaire (Ar la brique)',
  'sales.unitPriceRequired': 'Un prix entier en ariary est attendu.',
  'sales.totalLabel': 'Total :',
  'sales.saveNewSale': 'Enregistrer la vente',

  'sales.sheet.quantityLabel': 'Quantité (briques)',
  'sales.sheet.unitPriceLabel': 'Prix unitaire (Ar)',
  'sales.sheet.receivedLabel': 'Montant encaissé (Ar)',
  'sales.sheet.receivedHint': 'Laissez 0 si le client paiera plus tard.',
  'sales.sheet.receivedInvalid': 'Un montant entier en ariary est attendu.',
  'sales.sheet.receivedTooHigh': 'L’encaissement ne peut pas dépasser le total de la vente.',
  'sales.sheet.total': 'Total de la vente',
  'sales.sheet.paymentFailed': 'Vente enregistrée, mais l’encaissement a échoué :',
  'sales.sheet.openSale': 'Ouvrir la vente',

  'sales.keepSale': 'Garder la vente',
  'sales.cancelSale': 'Annuler la vente',
} as const;

export const mg: Record<keyof typeof fr, string> = {
  'sales.title': 'Varotra',
  'sales.newTitle': 'Varotra vaovao',
  'sales.allSales': 'Varotra rehetra',
  'sales.newLink': 'Ampidiro ny varotra',
  'sales.noCampaignSuffix': ' alohan’ny hampidirana varotra.',

  'sales.noneAtAll': 'Tsy mbola misy varotra voarakitra.',
  'sales.notFound': 'Tsy hita ilay varotra.',

  'sales.unknownClient': 'Mpanjifa tsy fantatra',

  'sales.status.ordered': 'Voabaiko',
  'sales.status.delivered': 'Notaterina',
  'sales.status.partiallyPaid': 'Voaloa antsasany',
  'sales.status.paid': 'Voaloa',

  'sales.progressComplete': '{quantity} notaterina avokoa',
  'sales.progressPartial': '{delivered} / {ordered}',
  'sales.deliveredOfOrdered': '{delivered} notaterina amin’ny {ordered}',

  'sales.clientLabel': 'Mpanjifa',
  'sales.clientRequired': 'Ilaina ny mpanjifa.',
  'sales.orderedQuantityLabel': 'Isa nobaikoina (biriky)',
  'sales.quantityRequired': 'Ilaina ny isa manontolo biriky.',
  'sales.unitPriceLabel': 'Vidiny isaky ny biriky (Ar)',
  'sales.unitPriceRequired': 'Ilaina ny vidiny isa manontolo an’ariary.',
  'sales.totalLabel': 'Fitambarana :',
  'sales.saveNewSale': 'Tehirizo ny varotra',

  'sales.sheet.quantityLabel': 'Isa (biriky)',
  'sales.sheet.unitPriceLabel': 'Vidiny isaky ny iray (Ar)',
  'sales.sheet.receivedLabel': 'Vola voaray (Ar)',
  'sales.sheet.receivedHint': 'Avelao ho 0 raha handoa any aoriana ny mpanjifa.',
  'sales.sheet.receivedInvalid': 'Vola ariary feno no andrasana.',
  'sales.sheet.receivedTooHigh': 'Tsy afaka mihoatra ny totalin’ny varotra ny vola voaray.',
  'sales.sheet.total': 'Totalin’ny varotra',
  'sales.sheet.paymentFailed': 'Voarakitra ny varotra, fa tsy nety ny fandraisam-bola :',
  'sales.sheet.openSale': 'Sokafy ny varotra',

  'sales.keepSale': 'Tazomy ny varotra',
  'sales.cancelSale': 'Foano ny varotra',
};
