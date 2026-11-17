# MaintiFlow — dossier de préparation CNDP (personne physique)

**Usage interne de préparation. Ne pas joindre de données personnelles au dépôt public.** Statut : **aucun dépôt, récépissé ou autorisation vérifié**.

## Identité du responsable (à remplir directement dans la plateforme CNDP)
- Qualité : **personne physique** exploitant le projet MaintiFlow au Maroc, sans société enregistrée.
- Identité légale : nom et prénom exacts du porteur de projet.
- Adresse/ville/code postal et moyens de contact : coordonnées véridiques du responsable exigées par la plateforme ; vérifier une éventuelle adresse professionnelle ou de domiciliation autorisée, sans inventer de société.
- Email opérationnel : maintiflow.contact@gmail.com.
- Le formulaire en ligne propose **Personne Physique** et **Je ne dispose pas d'ICE ?** ; suivre le parcours officiel plutôt que renseigner un faux ICE/RC.
- Ne pas placer les informations d'identité ou de domicile dans ce dépôt public ; conserver les pièces d'identité exclusivement dans le circuit de dépôt réglementaire approprié.

## Traitement de base envisagé
**Libellé suggéré** : « Gestion des demandes d'accès pilote au projet MaintiFlow ».

Finalité : traiter les demandes volontaires de présentation/pilote et les questions associées.

Catégories de personnes : représentants professionnels d'entreprises intéressées ayant eux-mêmes complété le formulaire.

Champs applicatifs : `full_name`, `email`, `company`, `city`, `team_size`, `challenge`, `consent_at`, `created_at`, identifiant aléatoire `id`.

Origine : formulaire MaintiFlow ; informations requises, non sensibles selon le formulaire inspecté. Les métadonnées techniques éventuellement collectées par prestataires doivent être documentées.

Accès : exploitant individuel ; Cloudflare agit comme hébergeur/prestataire, sous réserve d'analyse contractuelle. Resend reçoit une référence aléatoire de l'inscription et le contact du responsable pour les alertes ; il ne reçoit pas les coordonnées du prospect dans le corps de la notification.

Conservation projetée : 180 jours, purge quotidienne codée ; vérifier l'exécution du Cron, les sauvegardes et la suppression effective.

Base/légalité : consentement spécifique par case non précochée, à confirmer dans la déclaration et la mention d'information.

Sécurité : HTTPS, contrôle de format et de taille des requêtes, contrainte d'unicité, Turnstile *si activé* ; authentification et accès restreint au tableau D1. Vérifier WAF/rate-limit et conditions d'accès (ne pas prétendre que des contrôles non configurés sont actifs).

## Parcours administratif
1. Consulter https://www.cndp.ma/conformite-des-sites-web/ et https://www.cndp.ma/notifier-un-traitement/ .
2. Ouvrir le portail https://cndp-forms.ma/Account/Index ; rechercher le parcours **personne physique** / **sans ICE**.
3. Préparer la **déclaration normale F-211** si les règles et la CNDP confirment le régime de droit commun ; vérifier si un dispositif de déclaration simplifiée s'applique plutôt. Ne pas présenter une autorisation préalable comme acquise.
4. Joindre la capture du formulaire de collecte/consentement, la notice d'information complétée, et les documents contractuels de sous-traitance le cas échéant. Suivre les indications et les pièces effectivement demandées par le portail.
5. Une fois le traitement de base dûment notifié/validé, instruire la **question du transfert à l'étranger**, notamment pour Cloudflare D1. La CNDP utilise le **F-118** et l'examine sur la base du traitement principal déclaré/autorisé. Obtenir/valider les pays d'hébergement et garanties contractuelles exacts avant de compléter.
6. Conserver **en dehors du dépôt GitHub** les copies des formulaires, captures d'accusés, récépissés, dates et références.
7. Publier uniquement les mentions vérifiées et approuvées, puis réouvrir les inscriptions avec un drapeau de configuration explicite.

## Cloudflare et transfert
Selon la documentation Cloudflare D1 datée du 2 octobre 2026, les juridictions prises en charge sont EU, US et FedRAMP, et les indices d'emplacement n'incluent pas l'Afrique. L'emplacement réel de la base existante, l'éventuelle réplication, les sauvegardes et les journaux doivent être confirmés. **Ne pas supposer un stockage au Maroc.** Ne pas déplacer ou recréer la base actuelle sans plan de migration.

## Garde-fou technique
Le backend exige maintenant `PRIVACY_REVIEW_COMPLETE=true` dans l'environnement Cloudflare pour accepter de nouveaux leads ; variable absente ou différente de `true` => site consultable, formulaire désactivé et API POST renvoie HTTP 503. **N'activer la variable que lorsque les formalités et la notice sont réellement prêtes.**

## Sources officielles
- https://www.cndp.ma/conformite-des-sites-web/
- https://www.cndp.ma/notifier-un-traitement/
- https://www.cndp.ma/procedures-de-notification-process/
- https://www.cndp.ma/notifier-une-demande-de-transfert-a-letranger/
- https://cndp-forms.ma/Account/Index
- https://developers.cloudflare.com/d1/configuration/data-location/

Cette note est une préparation opérationnelle, pas un avis juridique.
