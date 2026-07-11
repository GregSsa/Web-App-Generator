# Base de données

La migration initiale définit profils, mangas, chapitres, progression, catégories, relations, souscriptions Push, notifications, journaux et paramètres. Les clés étrangères composites `(resource_id, user_id)` empêchent toute association entre propriétaires différents. Les URL de manga, chapitre et les notifications ont des contraintes d’unicité pour l’idempotence.

RLS est activée sur chaque table publique avec politiques séparées SELECT/INSERT/UPDATE/DELETE et contrôle `auth.uid() = user_id`. Les index couvrent la bibliothèque par statut, les mangas à vérifier, les chapitres non lus, les notifications et les journaux. L’archivage d’un manga conserve les données ; une suppression explicite déclenche les cascades uniquement sous ce manga.
