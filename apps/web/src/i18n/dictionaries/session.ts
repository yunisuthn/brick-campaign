/** Login and the session guard shown while it loads or fails. */
export const fr = {
  'session.tagline': 'Gestion de campagne de briques',
  'session.emailLabel': 'Email',
  'session.emailRequired': 'L’email est requis.',
  'session.passwordLabel': 'Mot de passe',
  'session.passwordRequired': 'Le mot de passe est requis.',
  'session.loginFailedPrefix': 'Connexion impossible :',
  'session.submit': 'Se connecter',
  'session.apiUnavailablePrefix': 'API indisponible :',
} as const;

export const mg: Record<keyof typeof fr, string> = {
  'session.tagline': 'Fitantanana vanim-potoanan’ny fanaovam-biriky',
  'session.emailLabel': 'Mailaka',
  'session.emailRequired': 'Ilaina ny mailaka.',
  'session.passwordLabel': 'Tenimiafina',
  'session.passwordRequired': 'Ilaina ny tenimiafina.',
  'session.loginFailedPrefix': 'Tsy voatahiry ny fidirana :',
  'session.submit': 'Hiditra',
  'session.apiUnavailablePrefix': 'Tsy azo idirana ny sehatra :',
};
