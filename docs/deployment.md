# Déploiement

1. Créer le projet Supabase et appliquer la migration initiale.
2. Configurer les URL de redirection Auth pour le domaine Vercel.
3. Générer VAPID et renseigner toutes les variables non optionnelles.
4. Importer le dépôt sur Vercel et déployer en production.
5. Vérifier `/api/cron/check-mangas` avec un Bearer `CRON_SECRET`, puis consulter les logs.

Hobby autorise le Cron quotidien configuré. Pour Pro, `0 * * * *` cible une exécution horaire. Les Cron ne tournent pas sur les previews. Les fonctions n’écrivent jamais sur le système de fichiers local.
