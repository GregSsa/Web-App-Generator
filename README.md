# Manga Tracker

PWA personnelle mobile-first pour suivre les mangas à partir de leurs URL, enregistrer la progression et détecter de nouveaux chapitres sans stocker leur contenu ou leurs images.

## Installation

Prérequis : Node.js 20.9+, un projet Supabase et, pour le déploiement, Vercel.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Appliquez `supabase/migrations/202607110001_initial_schema.sql` avec Supabase CLI ou le SQL Editor, puis renseignez les variables Supabase. Générez des clés VAPID avec `npx web-push generate-vapid-keys`. Les variables LLM sont facultatives : sans clé, l’extracteur déterministe et la correction manuelle restent disponibles.

## Scripts

- `npm run dev` : développement.
- `npm run lint` : ESLint.
- `npm run typecheck` : TypeScript strict.
- `npm run test` : tests Vitest.
- `npm run build` : build de production.

## Déploiement

Importez le dépôt dans Vercel, configurez les variables de `.env.example` et déployez. Le Cron Hobby de `vercel.json` s’exécute quotidiennement à 03:00 UTC. Sur Pro, remplacez son expression par `0 * * * *` pour une cible horaire. Le déclenchement exact n’est jamais garanti.

## Limites

L’application respecte les protections techniques des sources : aucun CAPTCHA, paywall, authentification ou blocage anti-bot n’est contourné. Les pages dynamiques dépendant de JavaScript peuvent nécessiter une saisie manuelle. Web Push dépend du navigateur, des permissions et du système Android. Consultez `docs/` pour l’architecture détaillée.
