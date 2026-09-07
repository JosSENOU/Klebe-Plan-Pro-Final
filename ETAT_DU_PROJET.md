# État du projet — Klébé Plan Pro

Analyse effectuée automatiquement (lecture des 2 PDF du dossier + inspection du code backend et frontend, tests réels : `php artisan route:list`, `php artisan migrate:status`, `php artisan serve` + requête HTTP réelle, `npm install` + `npm run dev`).

Date de l'analyse : voir date de ce fichier.

---

## 🔴 PROBLÈME CRITIQUE N°1 — L'API Laravel n'est pas branchée (rien ne fonctionne)

**Constat testé en réel :** `php artisan route:list` ne montre **aucune route `/api/*`**. Une requête `POST /api/register` envoyée au serveur local renvoie une erreur (route introuvable / 500).

**Cause :** `bootstrap/app.php` ne déclare que `web`, `commands` et `health` :
```php
->withRouting(
    web: __DIR__.'/../routes/web.php',
    commands: __DIR__.'/../routes/console.php',
    health: '/up',
)
```
Il manque `api: __DIR__.'/../routes/api.php'`. Le fichier `routes/api.php` existe et contient bien toutes les routes (login, register, rendez-vous, équipe, quota…) mais **Laravel ne le charge jamais**.

**Conséquence :** malgré un code métier propre et complet côté backend, **aucun endpoint n'est actuellement accessible**. Le frontend ne peut donc rien afficher de réel tant que ce n'est pas corrigé.

**Correctif (5 minutes) :**
```php
->withRouting(
    web: __DIR__.'/../routes/web.php',
    api: __DIR__.'/../routes/api.php',
    commands: __DIR__.'/../routes/console.php',
    health: '/up',
)
```

## 🔴 PROBLÈME CRITIQUE N°2 — Configuration Laravel incomplète (fragments non fusionnés)

Le dossier `config/` ne contient que `services.php` (pas de `app.php`, `auth.php`, `database.php`, `sanctum.php`, `cors.php`...). Plusieurs commentaires dans le code du backend indiquent explicitement que ces fichiers sont des **fragments à coller dans un projet Laravel principal** ("À COLLER dans routes/api.php", "À FUSIONNER dans app/Console/Kernel.php si un Kernel existe déjà"). Cela confirme que le backend livré est un **ensemble de contributions individuelles jamais entièrement fusionnées/initialisées** dans un vrai projet Laravel complet.

**Conséquence directe vérifiée :** la table `personal_access_tokens` (nécessaire à Sanctum pour générer les tokens d'API lors du login/register) n'existe pas dans la base (confirmé via `php artisan migrate:status` : seules les 3 migrations métier `entreprises`, `users`, `rendez_vous` sont listées). Même une fois le problème n°1 corrigé, `login`/`register` planteront tant que Sanctum n'est pas correctement installé (`composer require laravel/sanctum` + `php artisan vendor:publish --tag=sanctum-migrations` + migration).

## 🔴 PROBLÈME CRITIQUE N°3 — Le frontend n'est pas branché sur le backend

Bonne nouvelle : la couche `src/lib/api/*` (client HTTP, auth, quota, équipe, rendez-vous) est **bien écrite, bien commentée et prête** — elle bascule automatiquement en mode réel dès que `VITE_API_URL` est renseigné (c'est déjà fait dans `.env` : `VITE_API_URL=http://127.0.0.1:8000`).

**Mais les écrans ne l'utilisent pas tous :**
- `src/routes/connexion.tsx` (page de connexion) : n'appelle **jamais** `lib/api/auth.ts::login()`. Elle contient sa propre logique de vérification avec 3 comptes de démonstration codés en dur (`josephine@klebe.pro` / `shalom@klebe.pro` / `keira@klebe.pro`, mot de passe `klebe2026`), et un `setTimeout` qui simule un chargement puis redirige — **aucune requête réseau n'est envoyée**.
- `src/routes/index.tsx` (tableau de bord) : données affichées codées en dur, bouton "Nouveau rendez-vous" = simple `alert()`.
- `FormulaireRDV.jsx` : **bien codé et correctement branché sur l'API** (`POST /api/rendez-vous`), mais il est posé à la racine du projet (`klebe-plan-pro-Frontend/FormulaireRDV.jsx`) et non dans `src/routes/`. Le routing de TanStack Start (file-based routing, voir `src/routes/README.md`) ne le charge donc jamais : **aucune URL n'y mène**, le formulaire est invisible dans l'application réelle.
- `equipe.tsx` et `quota.tsx` : utilisent correctement `lib/api/team.ts` et `lib/api/quota.ts`, donc **prêts à fonctionner** une fois les problèmes n°1 et n°2 réglés côté backend.

---

## ✅ Ce qui est fait et fonctionne (ou fonctionnera dès que le branchement API sera réparé)

### Backend (Laravel)
- Modèles `Entreprise`, `User`, `RendezVous` avec relations correctes.
- CRUD complet des rendez-vous (`RendezVousController`) avec `RendezVousPolicy` (permissions propriétaire/assistante).
- `AuthController` : register (création entreprise + compte propriétaire) et login via Sanctum — logique correcte.
- `TeamController` : ajout/liste des membres de l'équipe.
- `QuotaController` : calcul quota mensuel / utilisé / restant.
- `WhatsAppService` + commande Artisan `EnvoyerRappelsWhatsApp` : logique des 3 rappels (veille 18h, jour J 8h, 15 min avant) correctement implémentée et programmée dans le scheduler (`Kernel.php`).
- Migrations et factories métier (`entreprises`, `users`, `rendez_vous`) fonctionnelles.
- `npm install` + `vite dev` du frontend démarrent sans erreur sur `http://localhost:8080`.

### Frontend (React / TanStack Start)
- Structure de l'app, design system, navigation (`__root.tsx`) bien construits.
- Pages Équipe et Quota déjà branchées proprement sur la vraie API (via `lib/api`).
- `FormulaireRDV.jsx` fonctionnellement correct (juste mal placé).
- Écrans visuellement complets et conformes à la maquette/aux specs des PDF.

---

## ❌ Ce qu'il reste à faire (par ordre de priorité)

1. **Corriger `bootstrap/app.php`** pour charger `routes/api.php` (problème n°1).
2. **Installer/finaliser Sanctum** : config, migration `personal_access_tokens`, puis relancer les migrations.
3. **Vérifier/compléter les autres fichiers `config/`** manquants (`app.php`, `auth.php`, `database.php`, `cors.php`) — probablement à copier depuis un squelette Laravel standard puis adapter.
4. **Déplacer `FormulaireRDV.jsx`** dans `src/routes/rendez-vous.tsx` (ou équivalent) pour qu'il soit réellement accessible dans l'application, en respectant le routing par fichier de TanStack Start.
5. **Reconnecter `connexion.tsx`** à `lib/api/auth.ts::login()` au lieu de la vérification codée en dur des 3 comptes démo.
6. **Reconnecter `index.tsx`** (tableau de bord) aux vraies données (rendez-vous à venir, quota, etc.) au lieu des valeurs statiques, et remplacer l'`alert()` du bouton "Nouveau rendez-vous" par une navigation réelle vers le formulaire.
7. **Tester end-to-end** une fois tout branché : inscription → connexion → création de RDV → vérification que les rappels WhatsApp sont bien programmés → suivi du quota.
8. Configurer les vraies clés API WhatsApp (actuellement `WhatsAppService` doit être vérifié pour confirmer qu'il utilise une clé réelle et pas un mode simulation/log).

---

## Résumé en une phrase

Le travail individuel de chaque personne (logique métier backend, écrans frontend, formulaire, service WhatsApp) est globalement **bien fait et conforme aux PDF de spécification**, mais **l'intégration finale n'a pas été terminée** : l'API n'est pas chargée par Laravel, Sanctum n'est pas complètement installé, et plusieurs écrans frontend ne sont pas encore reliés aux modules API pourtant déjà prêts. C'est un problème de **branchage/assemblage final**, pas de logique métier à refaire.
