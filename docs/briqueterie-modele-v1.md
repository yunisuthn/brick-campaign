# Gestion de briqueterie — Modèle v1

Document de référence validé le 8 septembre 2026. Il fixe le périmètre, le modèle de données, les règles de calcul et les décisions d'architecture. Toute modification passe par ce document avant le code.

## 1. Contexte métier

Activité saisonnière de fabrication et de vente de briques cuites.

- La **campagne** démarre en mai. Avant, des investissements : contrat de rizière, tai-charbon et akofa (combustibles de cuisson).
- Les **mouleurs** (une personne ou un foyer de 2-3) reçoivent matériel et vatsy hebdomadaire, plus des avances. Ils sont payés à la brique, le solde réglé en fin de campagne.
- Trois étapes de main-d'œuvre, payées à la brique : moulage (mouleurs), transport vers le four et enfournement (autres personnes, nom libre).
- **Cuisson par lot** de 40 000 briques minimum. La casse n'est pas comptée : quantité entrée = quantité sortie.
- **Ventes** de briques cuites uniquement, un seul type de brique, prix négocié par vente selon le cours. Livraison par camionnette de l'exploitation, 2 300-2 500 briques par voyage. Le client paie en une fois quand tout est livré.
- Deux utilisateurs : l'exploitante et son père. Saisie le soir depuis un lieu connecté.

## 2. Périmètre

### Dans la v1

1. Campagnes
2. Mouleurs, productions, versements, calcul du dû
3. Prestations transport-four / enfournement (nom libre)
4. Lots de cuisson
5. Clients, ventes, livraisons
6. Dépenses par catégorie
7. Tableau de bord par campagne

### Hors v1 (roadmap)

- Mode hors-ligne / synchronisation
- Rôles et permissions
- Types de briques
- Comptage de la casse à la cuisson
- Paiements clients partiels
- Ajustements d'inventaire
- Application native Android

## 3. Entités

| Entité             | Champs                                                                                                                                    | Notes                                                                                                                                                                                      |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Campagne**       | année, date début, date clôture (nullable), tarif moulage/brique, tarif transport/brique, tarif enfournement/brique (les trois nullables) | Racine de toutes les données. Les tarifs vivent ici car ils changent par saison. Un tarif absent est « à fixer » : il se négocie parfois en cours de saison (décidé le 10 septembre 2026). |
| **Rizière**        | nom, localisation, surface (opt.), type contrat (durable / campagne)                                                                      | Le coût du contrat est une Dépense, pas un champ ici.                                                                                                                                      |
| **Mouleur**        | nom du responsable, nombre de membres, actif                                                                                              | Unité de production et de paie. Une personne seule = mouleur à 1 membre. Affiché « Mouleur » dans l'interface (tranché le 10 septembre 2026).                                              |
| **Production**     | date, campagne, mouleur, rizière, quantité                                                                                                | Aucun montant stocké.                                                                                                                                                                      |
| **Prestation**     | date, campagne, type (transport-four / enfournement), nom libre, quantité, lot de cuisson                                                 | Nom libre éditable. Le dû se calcule par nom exact — documenté comme limite connue.                                                                                                        |
| **Versement**      | date, campagne, bénéficiaire (mouleur ou nom libre de prestation), type (vatsy / avance / solde), montant                                 | Remplace la colonne « payé » du cahier.                                                                                                                                                    |
| **Lot de cuisson** | campagne, date enfournement, date défournement (nullable), quantité                                                                       | Fait passer la quantité de « crue » à « cuite ».                                                                                                                                           |
| **Client**         | nom, téléphone, localité                                                                                                                  |                                                                                                                                                                                            |
| **Vente**          | campagne, client, date, quantité commandée, prix unitaire, date paiement (nullable), montant encaissé                                     | Statut dérivé : commandée / livrée / payée.                                                                                                                                                |
| **Livraison**      | vente, date, quantité, coût (carburant + chauffeur), immatriculation (opt.)                                                               | Une vente = plusieurs voyages.                                                                                                                                                             |
| **Dépense**        | campagne, date, catégorie, montant, libellé, lot (opt.), rizière (opt.)                                                                   | Catégories : rizière, akofa, tai-charbon, carburant, réparation, nourriture, autre.                                                                                                        |
| **Utilisateur**    | email, mot de passe haché                                                                                                                 | Deux comptes, pas de rôle.                                                                                                                                                                 |

## 4. Règles de calcul

Toutes dérivées à la lecture. Aucune n'est stockée.

- **Stock crue** = Σ Production − Σ quantité des lots enfournés
- **Stock cuite** = Σ quantité des lots défournés − Σ quantité des livraisons
- **Vente livrée** ⇔ Σ livraisons ≥ quantité commandée
- **Dû à un mouleur** = Σ Production × tarif moulage − Σ Versements
- **Dû à un prestataire** = Σ Prestation × tarif du type − Σ Versements (par nom)
- **Coût d'un lot** = Σ Dépenses rattachées + Σ Prestations du lot × tarifs
- **Chiffre d'affaires** = Σ quantité commandée × prix unitaire
- **Encaissé** = Σ montant encaissé
- **Résultat de campagne** = Encaissé − Σ Dépenses − Σ main-d'œuvre due (versée ou non) − Σ coûts de livraison

Le tableau de bord distingue toujours chiffre d'affaires, encaissé et reste à encaisser.

**Tarif à fixer.** Un calcul qui a besoin d'un tarif absent pour une quantité non nulle donne un montant inconnu (`null`), jamais 0 : dû, coût du lot, main-d'œuvre et résultat de campagne sont alors inconnus, et l'interface les affiche « tarif à fixer ». Une quantité nulle ne dépend d'aucun tarif. Un tarif fixé après coup s'applique à toute la campagne, y compris aux saisies antérieures : c'est le prix négocié pour la saison.

## 5. Décisions d'architecture et justification

- **Pas de quantité en stock en base.** Un stock stocké finit toujours par diverger du réel. Le stock est une somme sur les saisies ; une correction future passera par une entité `Ajustement`, jamais par une colonne modifiable.
- **Pas de montant calculé stocké** (total vente, dû ouvrier). Un calcul se corrige à un endroit ; une colonne fausse se corrige ligne par ligne.
- **Pas de suppression physique.** Une saisie erronée est corrigée ou annulée (soft delete), l'historique reste.
- **Tarifs sur la campagne**, pas sur chaque saisie : un seul endroit à changer entre deux saisons.
- **Pas de hors-ligne en v1.** Deux utilisateurs saisissant le soir ne justifient pas la complexité de synchronisation.
- **Pas de rôles en v1.** Deux comptes de confiance.

## 6. Stack

- Back : NestJS, Prisma, PostgreSQL
- Front : React, Vite, TypeScript, PWA
- Monorepo, Docker Compose, GitHub Actions (lint, tests, build)
- Tests en priorité sur les règles de calcul (section 4)

## 7. Ordre des chantiers

Chaque chantier est terminé, testé et committé avant le suivant.

1. Squelette du dépôt, Docker Compose, CI, authentification
2. Campagne
3. Mouleur → Production → Versement → calcul du dû
4. Lot de cuisson → stock crue/cuite
5. Client → Vente → Livraison
6. Dépense
7. Tableau de bord

## 8. Points ouverts

- Tarif enfournement : confirmé à la brique ? (supposé oui)

Tranchés :

- Tarifs nullables sur la campagne, « à fixer » tant qu'ils ne sont pas négociés (10 septembre 2026, section 3 et 4).
- « Mouleur » est le nom affiché dans l'interface : le mot du cahier, valable pour une personne seule comme pour un foyer (10 septembre 2026).

## 9. Front — plan des écrans

Ajouté le 9 septembre 2026, une fois les sept chantiers de l'API livrés. Même règle : chaque chantier est terminé, testé et committé avant le suivant, sur la branche `feat/front`.

### 9.1 Principes

- **Téléphone d'abord.** Saisie le soir, sur mobile, d'une main. Un écran = une tâche. Les listes sont triées du plus récent au plus ancien, comme l'API.
- **Interface en français**, vocabulaire du cahier (vatsy, akofa, tai-charbon gardés tels quels).
- **L'API fait foi.** Le front n'a aucune règle de calcul : stock, dû, statut, coût, résultat viennent de l'API. Il valide seulement la forme (champ requis, nombre entier, date) et affiche les erreurs 400 renvoyées.
- **Pas de hors-ligne en v1** (section 5). La PWA se limite à l'installation sur l'écran d'accueil et au chargement de la coquille.
- **Une campagne courante** choisie en tête d'écran, gardée en session, préfixe de toutes les saisies.

### 9.2 Choix techniques

| Sujet         | Choix                                       | Justification                                                                                                                                    |
| ------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Application   | `apps/web` : React, Vite, TypeScript        | Stack fixée en section 6, même monorepo, même lint et prettier                                                                                   |
| Routage       | React Router                                | Routes courtes sous la campagne courante (`/productions`, `/ventes/:id`), le sélecteur d'en-tête fixe la campagne (tranché le 10 septembre 2026) |
| Données       | TanStack Query                              | Cache par ressource, invalidation après chaque saisie, état de chargement uniforme                                                               |
| Formulaires   | React Hook Form                             | Formulaires nombreux et courts, validation de forme sans dupliquer les règles                                                                    |
| Session       | Cookie de l'API, `GET /auth/me` au départ   | Rien à stocker côté front ; un 401 renvoie à la connexion                                                                                        |
| Style         | CSS modules, pas de librairie de composants | Une dizaine d'écrans simples ; une dépendance de moins à porter                                                                                  |
| Tests         | Vitest + Testing Library, MSW pour l'API    | Tester les écrans contre des réponses d'API réalistes, sans serveur                                                                              |
| Développement | Proxy Vite vers l'API, port lu dans `.env`  | Même origine, le cookie de session passe sans configuration CORS                                                                                 |

Les schémas Zod des DTO restent dans l'API. Si le front en a besoin, ils seront extraits dans `packages/contracts` à ce moment-là, pas avant.

### 9.3 Ordre des chantiers

1. **Squelette** : `apps/web` avec Vite, lint et prettier partagés, proxy vers l'API, manifeste PWA minimal, CI (lint, build, tests). Page vide qui appelle `GET /health`.
2. **Session** : écran de connexion, déconnexion, garde des routes, rechargement de la session au démarrage.
3. **Campagnes** : liste, création avec les trois tarifs, fiche, clôture. Choix de la campagne courante.
4. **Référentiels** : mouleurs (avec retrait), rizières, clients. Liste et formulaire pour chacun.
5. **Productions** : saisie du jour (mouleur, rizière, quantité), liste de la campagne, correction, annulation.
6. **Versements et dû** : saisie d'un versement (mouleur ou prestataire), page des soldes mouleurs et prestataires.
7. **Lots et prestations** : lots avec enfournement et défournement, prestations rattachées, coût du lot, stock crue / four / cuite.
8. **Ventes et livraisons** : ventes avec statut, encaissement, livraisons par voyage.
9. **Dépenses** : saisie par catégorie, rattachement optionnel à un lot ou une rizière, liste filtrée. Fait avant le chantier 8, le 10 septembre 2026 : à l'essai, le besoin de saisir le prix d'un contrat de rizière est apparu tout de suite. La fiche d'une rizière affiche donc le total des dépenses qui lui sont rattachées sur la campagne courante, et non un champ prix : une rizière est un référentiel partagé entre campagnes, un contrat se paie saison par saison.
10. **Tableau de bord** : chiffre d'affaires, encaissé, reste à encaisser, dépenses par catégorie, main-d'œuvre due et versée, coûts de livraison, résultat, stock.
11. **PWA** : icônes, installation, coquille en cache. Rien de plus.

### 9.4 Points ouverts du front

Aucun. Les deux derniers sont tranchés ci-dessous.

Tranchés au chantier 3 (10 septembre 2026) :

- Format des montants : `1 250 000 Ar`, dates « 10 mai 2026 ».
- Campagne courante gardée en `localStorage`, pas en session : sur un téléphone l'onglet se ferme sans arrêt et la campagne est la même toute la saison. Sans choix, la campagne ouverte la plus récente est prise par défaut.

Tranchés le 11 septembre 2026, les onze chantiers livrés :

- Le tableau de bord est la page d'accueil d'une campagne (chantier 10). La liste des saisies du jour n'a pas été réclamée à l'essai.
- Les erreurs de l'API s'affichent en français, traduites côté front à partir d'un code renvoyé par l'API (section 10.1).

## 10. Après le front — ce qui reste avant la mise en ligne

Ajouté le 11 septembre 2026, les sept chantiers de l'API (section 7) et les onze du front (section 9.3) étant livrés. Trois lots restent, dans cet ordre. Même règle qu'avant : chaque chantier terminé, testé et committé avant le suivant.

### 10.1 Lot A — les erreurs dans la langue de l'interface

Une saisie refusée affiche aujourd'hui « Création impossible : Validation failed », et un identifiant périmé « Chargement impossible : Campaign 8f3a… not found ». Le détail que l'API place dans `issues` n'est jamais lu par le front.

**Tranché : le code vient de l'API, les mots viennent du front.** Chaque erreur métier de l'API porte un code stable (`campaign_not_found`, `date_outside_campaign`, `moulder_inactive`…) à côté de son message anglais, qui reste pour les journaux et les tests e2e. Le front traduit ce code. La langue de l'interface appartient à l'interface, comme le format des montants et des dates tranché au chantier 3, et l'API garde une surface qu'un autre client lirait de la même façon. Le prix est assumé : chaque exception doit recevoir son code, et un code sans traduction doit se voir en test plutôt qu'à l'écran.

1. **Codes d'erreur dans l'API** : un code sur chaque exception métier, le tableau `issues` de la validation inchangé, e2e qui vérifient le code et non la phrase.
2. **Traduction dans le front** : une table code → phrase française, un repli visible quand un code manque, les messages de chargement et d'enregistrement passés dessus.
3. **Chaque erreur sous son champ** : les `issues` de validation rattachées au champ par leur `path`, ce qui ne vise aucun champ restant en tête de formulaire.

### 10.2 Lot B — la mise en ligne

L'application ne tourne qu'en développement : le front passe par le proxy Vite, `docker-compose.yml` ne lève que Postgres, et le dépôt n'a pas de README. Pour une saisie le soir depuis un lieu connecté (section 1) :

4. **L'API sert le front construit** : même origine, cookie de session sans CORS, ce que le proxy Vite imite déjà en développement. Tranché le 11 septembre 2026 : un seul conteneur, pas de reverse proxy à tenir en plus, et le front et l'API ne peuvent plus se retrouver en versions différentes puisqu'ils partent ensemble. L'API prend le préfixe `/api`, celui que le front appelle déjà ; le proxy Vite cesse de le retirer, si bien que les chemins sont les mêmes en développement, en test et en ligne. Tout chemin qui n'est pas sous `/api` rend la coquille du front.
5. **Image de production** et compose qui la lance avec Postgres, migrations appliquées au démarrage.
6. **Hébergement et sauvegarde quotidienne de la base.** Une saison de saisies n'existe nulle part ailleurs.
7. **README** : installer, développer, tester, déployer, créer les deux comptes.

### 10.3 Lot C — finition

8. **Fusion de `feat/front` dans `main`.**
9. **Tests du front** : 120 s pour 45 fichiers parce que jsdom est reconstruit à chaque fichier. Fait le 11 septembre 2026, 13 s désormais. La voie qui gardait l'isolation par fichier (`pool: 'vmThreads'`) n'expose pas les globaux dont MSW a besoin et ne démarre pas ; c'est donc l'environnement partagé (`isolate: false`) qui est retenu. Les fichiers s'exécutent toujours l'un après l'autre et la mise en place remet à zéro les simulacres d'API, le DOM et `localStorage` entre chaque test : ce qui fuirait d'un fichier à l'autre est un état de module, à surveiller si un test devient capricieux.
10. **Revue de sécurité** avant la mise en ligne.

### 10.4 Points ouverts

- Tarif d'enfournement à la brique : toujours supposé oui (section 8).
- Hébergeur non choisi (chantier 6).
