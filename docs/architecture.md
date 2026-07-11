# Architecture

L’App Router sépare pages publiques, authentification et espace protégé. Les pages serveur lisent Supabase sous RLS ; les formulaires interactifs sont de petits îlots clients. Les mutations internes utilisent des Server Actions. L’extraction, le Cron et Web Push utilisent des Route Handlers. Supabase est la source de vérité ; le Service Worker ne conserve que le shell et les réponses GET non sensibles récemment consultées.

Flux d’ajout : URL → endpoint authentifié → validation SSRF/DNS → téléchargement borné → adaptateur → Zod → confirmation utilisateur → Server Action → Supabase/RLS.

Flux de contrôle : Cron secret ou utilisateur authentifié → sélection du manga appartenant à l’utilisateur → extraction → comparaison prudente → chapitre et notification idempotents → journal et backoff.
