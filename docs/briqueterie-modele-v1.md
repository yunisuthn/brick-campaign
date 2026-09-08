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

| Entité | Champs | Notes |
|---|---|---|
| **Campagne** | année, date début, date clôture (nullable), tarif moulage/brique, tarif transport/brique, tarif enfournement/brique | Racine de toutes les données. Les tarifs vivent ici car ils changent par saison. |
| **Rizière** | nom, localisation, surface (opt.), type contrat (durable / campagne) | Le coût du contrat est une Dépense, pas un champ ici. |
| **Mouleur** | nom du responsable, nombre de membres, actif | Unité de production et de paie. Une personne seule = mouleur à 1 membre. Nom affiché dans l'UI à confirmer (« Mouleur » / « Équipe »). |
| **Production** | date, campagne, mouleur, rizière, quantité | Aucun montant stocké. |
| **Prestation** | date, campagne, type (transport-four / enfournement), nom libre, quantité, lot de cuisson | Nom libre éditable. Le dû se calcule par nom exact — documenté comme limite connue. |
| **Versement** | date, campagne, bénéficiaire (mouleur ou nom libre de prestation), type (vatsy / avance / solde), montant | Remplace la colonne « payé » du cahier. |
| **Lot de cuisson** | campagne, date enfournement, date défournement (nullable), quantité | Fait passer la quantité de « crue » à « cuite ». |
| **Client** | nom, téléphone, localité | |
| **Vente** | campagne, client, date, quantité commandée, prix unitaire, date paiement (nullable), montant encaissé | Statut dérivé : commandée / livrée / payée. |
| **Livraison** | vente, date, quantité, coût (carburant + chauffeur), immatriculation (opt.) | Une vente = plusieurs voyages. |
| **Dépense** | campagne, date, catégorie, montant, libellé, lot (opt.), rizière (opt.) | Catégories : rizière, akofa, tai-charbon, carburant, réparation, nourriture, autre. |
| **Utilisateur** | email, mot de passe haché | Deux comptes, pas de rôle. |

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

- Nom de l'entité `Mouleur` dans l'interface
- Tarif enfournement : confirmé à la brique ? (supposé oui)