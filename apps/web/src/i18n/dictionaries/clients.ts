/** The Clients screens: the list, the detail/edit form, and the creation form. */
export const fr = {
  'clients.title': 'Clients',
  'clients.newLink': 'Nouveau client',
  'clients.none': 'Aucun client.',
  'clients.notFound': 'Client introuvable.',
  'clients.allClients': 'Tous les clients',

  'clients.nameLabel': 'Nom',
  'clients.nameRequired': 'Le nom est requis.',
  'clients.phoneLabel': 'Téléphone',
  'clients.localityLabel': 'Localité',
  'clients.localityRequired': 'La localité est requise.',

  'clients.createFailedPrefix': 'Création impossible :',
  'clients.createButton': 'Créer le client',
  'clients.newTitle': 'Nouveau client',
} as const;

export const mg: Record<keyof typeof fr, string> = {
  'clients.title': 'Mpanjifa',
  'clients.newLink': 'Mpanjifa vaovao',
  'clients.none': 'Tsy misy mpanjifa.',
  'clients.notFound': 'Tsy hita ilay mpanjifa.',
  'clients.allClients': 'Mpanjifa rehetra',

  'clients.nameLabel': 'Anarana',
  'clients.nameRequired': 'Ilaina ny anarana.',
  'clients.phoneLabel': 'Telefaonina',
  'clients.localityLabel': 'Toerana',
  'clients.localityRequired': 'Ilaina ny toerana.',

  'clients.createFailedPrefix': 'Tsy voaforona :',
  'clients.createButton': 'Forony ilay mpanjifa',
  'clients.newTitle': 'Mpanjifa vaovao',
};
