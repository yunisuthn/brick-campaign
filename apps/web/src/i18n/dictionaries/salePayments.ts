/** The Encaissements screens: a sale's payment list, the entry form, and the correction/cancel page. */
export const fr = {
  'salePayments.sectionTitle': 'Encaissements',
  'salePayments.receivedLine': '{received} reçus sur {total}',
  'salePayments.outstandingSuffix': ', reste {outstanding} à encaisser',
  'salePayments.addPaymentLink': 'Encaisser un versement',
  'salePayments.noneAtAll': 'Rien reçu pour le moment.',

  'salePayments.backToSale': 'Retour à la vente',
  'salePayments.title': 'Encaissement',
  'salePayments.newTitle': 'Nouvel encaissement',
  'salePayments.notFound': 'Encaissement introuvable.',
  'salePayments.saleNotFound': 'Vente introuvable.',
  'salePayments.ceilingLine': 'Cet encaissement peut aller jusqu’à {ceiling}.',
  'salePayments.outstandingLine': 'Reste à encaisser : {outstanding}.',
  'salePayments.createFailedPrefix': 'Encaissement impossible :',
  'salePayments.submitButton': 'Encaisser',

  'salePayments.amountLabel': 'Montant reçu (Ar)',

  'salePayments.keepPayment': 'Garder l’encaissement',
  'salePayments.cancelPayment': 'Annuler l’encaissement',
} as const;

export const mg: Record<keyof typeof fr, string> = {
  'salePayments.sectionTitle': 'Fandraisam-bola',
  'salePayments.receivedLine': '{received} efa noraisina amin’ny {total}',
  'salePayments.outstandingSuffix': ', sisa {outstanding} horaisina',
  'salePayments.addPaymentLink': 'Raiso ny fandoavam-bola iray',
  'salePayments.noneAtAll': 'Mbola tsy nisy noraisina.',

  'salePayments.backToSale': 'Hiverina any amin’ny varotra',
  'salePayments.title': 'Fandraisam-bola',
  'salePayments.newTitle': 'Fandraisam-bola vaovao',
  'salePayments.notFound': 'Tsy hita ilay fandraisam-bola.',
  'salePayments.saleNotFound': 'Tsy hita ilay varotra.',
  'salePayments.ceilingLine': 'Mety hatramin’ny {ceiling} ity fandraisam-bola ity.',
  'salePayments.outstandingLine': 'Sisa horaisina : {outstanding}.',
  'salePayments.createFailedPrefix': 'Tsy voaray ny vola :',
  'salePayments.submitButton': 'Raiso ny vola',

  'salePayments.amountLabel': 'Vola noraisina (Ar)',

  'salePayments.keepPayment': 'Tazomy ny fandraisam-bola',
  'salePayments.cancelPayment': 'Foano ny fandraisam-bola',
};
