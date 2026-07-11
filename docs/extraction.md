# Extraction

Le pipeline valide l’URL, résout toutes les adresses DNS, bloque réseaux privés/réservés, ports non standards et identifiants, puis répète ce contrôle à chaque redirection. Le téléchargement impose 10 secondes, trois redirections et 1,5 Mo. Aucun JavaScript n’est exécuté.

L’adaptateur générique lit titre, Open Graph, URL canonique et liens de chapitres. Ajoutez une source autorisée en implémentant `SourceAdapter` puis en l’enregistrant dans le registre. Une erreur d’adaptateur doit revenir au générique. Le fallback OpenAI facultatif reçoit uniquement un extrait nettoyé et sa sortie JSON Schema est validée par Zod. En cas d’échec ou d’ambiguïté, l’utilisateur corrige les champs manuellement.
