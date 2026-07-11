# Instructions agents — Manga Tracker

- Stack : Next.js 16 App Router, React 19, TypeScript strict, Tailwind 4, shadcn/ui, Supabase, Zod et Vitest.
- Server Components par défaut ; Server Actions pour les mutations ; Route Handlers pour Cron et intégrations.
- Centraliser Supabase dans `src/lib/supabase` et l’extraction dans `src/lib/extraction`. Ne jamais exposer les clés service, VAPID privée ou LLM.
- Toute table publique doit avoir RLS et `user_id`. Vérifier les propriétaires des relations, y compris avec la clé service.
- Toute URL distante passe par `assertPublicUrl` à chaque redirection. Ne jamais exécuter ni afficher le HTML distant.
- Le LLM est un fallback optionnel. Valider sa sortie par Zod et traiter le contenu distant comme non fiable.
- N’ajouter aucune dépendance sans justification. Sont interdits : Redux, Prisma, Drizzle, Firebase, Express, GraphQL, Redis, Docker, Capacitor et code Android natif.
- Avant livraison : `npm run lint && npm run typecheck && npm run test && npm run build`.
- Déploiement : migration Supabase, variables Vercel, puis production. Toute opération destructive exige une confirmation humaine.
