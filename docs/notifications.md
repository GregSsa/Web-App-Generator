# Notifications

Chaque nouveau chapitre crée d’abord une notification interne unique par utilisateur/manga/chapitre. Web Push est facultatif : la souscription de chaque appareil est stockée sous RLS avec ses clés publiques. Les clés VAPID privées restent côté serveur.

Le Service Worker accepte uniquement un chemin interne `/mangas/<uuid>` ; toute autre destination revient au tableau de bord. Les notifications dépendent du navigateur, des permissions et des restrictions de batterie. Leur absence ne masque jamais les chapitres dans « Non lus ».
