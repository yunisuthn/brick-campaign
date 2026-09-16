/** The Livraisons screens: a sale's trip list, the entry form, and the correction/cancel page. */
export const fr = {
  'deliveries.sectionTitle': 'Livraisons',
  'deliveries.addTrip': 'Ajouter un voyage',
  'deliveries.noneAtAll': 'Aucun voyage effectué.',

  'deliveries.backToSale': 'Retour à la vente',
  'deliveries.newTitle': 'Nouveau voyage',
  'deliveries.notFound': 'Voyage introuvable.',
  'deliveries.firedStockLine': 'Stock cuite : {stock}.',

  'deliveries.quantityLabel': 'Quantité (briques)',
  'deliveries.quantityRequired': 'Un nombre entier de briques est attendu.',
  'deliveries.costLabel': 'Coût du voyage (Ar)',
  'deliveries.costRequired': 'Un montant entier en ariary est attendu, zéro compris.',
  'deliveries.plateLabel': 'Immatriculation (facultatif)',

  'deliveries.saveTrip': 'Enregistrer le voyage',
  'deliveries.keepTrip': 'Garder le voyage',
  'deliveries.cancelTrip': 'Annuler le voyage',
} as const;

export const mg: Record<keyof typeof fr, string> = {
  'deliveries.sectionTitle': 'Fitaterana',
  'deliveries.addTrip': 'Ampio dingana iray',
  'deliveries.noneAtAll': 'Mbola tsy nisy dingana natao.',

  'deliveries.backToSale': 'Hiverina any amin’ny varotra',
  'deliveries.newTitle': 'Dingana vaovao',
  'deliveries.notFound': 'Tsy hita ilay dingana.',
  'deliveries.firedStockLine': 'Biriky masaka an-tahiry : {stock}.',

  'deliveries.quantityLabel': 'Isa (biriky)',
  'deliveries.quantityRequired': 'Ilaina ny isa manontolo biriky.',
  'deliveries.costLabel': 'Vidin’ny dingana (Ar)',
  'deliveries.costRequired': 'Ilaina ny vola isa manontolo an’ariary, azo atao ny aotra.',
  'deliveries.plateLabel': 'Nomera fiara (tsy voatery)',

  'deliveries.saveTrip': 'Tehirizo ny dingana',
  'deliveries.keepTrip': 'Tazomy ny dingana',
  'deliveries.cancelTrip': 'Foano ny dingana',
};
