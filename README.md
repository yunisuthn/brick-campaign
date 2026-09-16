# Briqueterie

Gestion d'une campagne de fabrication et de vente de briques cuites : mouleurs, production,
versements, lots de cuisson, ventes, livraisons, dépenses, tableau de bord.

Deux utilisateurs, une saisie le soir depuis un téléphone. Le périmètre, le modèle de données,
les règles de calcul et les décisions d'architecture sont dans
[docs/briqueterie-modele-v1.md](docs/briqueterie-modele-v1.md), qui fait foi : toute
modification y passe avant le code.

## Ce qu'il y a dedans

| Dossier              | Rôle                                                                |
| -------------------- | ------------------------------------------------------------------- |
| `apps/api`           | NestJS, Prisma, PostgreSQL. Toutes les règles de calcul vivent ici. |
| `apps/web`           | React, Vite, TypeScript, PWA. Français, téléphone d'abord.          |
| `packages/contracts` | Ce sur quoi les deux doivent s'accorder : les codes d'erreur.       |
| `docs`               | Le document de référence.                                           |

## Installer

Node 22 ou plus, pnpm (repris de `packageManager`), Docker pour la base.

```sh
cp .env.example .env          # puis remplir JWT_SECRET et le mot de passe Postgres
pnpm install
docker compose up -d          # Postgres, publié sur POSTGRES_PORT (5433 par défaut)
pnpm --filter api exec prisma migrate deploy
pnpm --filter api exec prisma generate
```

Le client Prisma est généré, jamais commité : `prisma generate` est à relancer après chaque
migration, sans quoi le code importe un client périmé.

## Développer

```sh
pnpm --filter api start:dev   # API sur PORT (3000 par défaut)
pnpm --filter web dev         # front sur 5173, /api renvoyé vers l'API
```

Le front appelle l'API sous `/api` et le proxy Vite l'y laisse : le chemin est le même en
développement, en test et en ligne. `PORT` est lu dans le `.env` de la racine par les deux, et
`API_URL` remplace la cible entière quand l'API tourne ailleurs.

## Les deux comptes

Il n'y a pas d'inscription. Chaque compte est créé en ligne de commande :

```sh
SEED_USER_EMAIL=elle@example.mg SEED_USER_PASSWORD=douze-caracteres-minimum \
  pnpm --filter api create-user
```

Le script refuse d'écraser un compte existant ; `--reset-password` le lui permet.

## Vérifier

```sh
pnpm lint
pnpm format:check
pnpm build
pnpm test        # unitaires, sans base
pnpm test:e2e    # bout en bout, base requise et migrations appliquées
```

C'est ce que la CI exécute, dans cet ordre, sur chaque pull request.

## Mettre en ligne

Un seul port à ouvrir : l'API sert le front qu'elle embarque, sur la même origine, si bien que
le cookie de session ne demande aucune configuration CORS.

```sh
cp .env.example .env          # JWT_SECRET, POSTGRES_PASSWORD, APP_PORT
docker compose -f compose.prod.yml up -d --build
```

Trois services : Postgres, un conteneur de migration qui s'arrête une fois les migrations
passées, puis le serveur. Une migration qui échoue arrête le déploiement avant que quoi que ce
soit ne serve.

Les comptes se créent ensuite depuis le conteneur de migration, qui a les outils :

```sh
docker compose -f compose.prod.yml run --rm \
  -e SEED_USER_EMAIL=elle@example.mg -e SEED_USER_PASSWORD=douze-caracteres-minimum \
  migrate pnpm --filter api create-user
```

**La base n'est sauvegardée par personne.** Une saison de saisies n'existe nulle part ailleurs :
prévoir un `pg_dump` quotidien vers un autre disque avant la première vraie campagne.
