# Klébé Plan Pro — Backend

Assistant WhatsApp qui aide une entreprise à gérer les rendez-vous de son DG
et à automatiser les rappels (veille 18h, jour J 8h, 15 min avant).

Backend Laravel 11 — tâches Pinel (données & API RDV) et Bilal (auth, WhatsApp,
rappels, quota), Sprint V1.3 (23 → 31 août 2026).

---

## 1. Stack technique

- PHP 8.2 (via XAMPP)
- Laravel 11 (framework, artisan, sanctum pour l'auth API par token)
- Base de données : **MySQL** (via XAMPP), nom de la base : `klebe_plan_pro`
- Auth : Laravel Sanctum (tokens API, pas de session cookie)

---
## 2. Prérequis pour lancer le projet

- XAMPP installé et **démarré** (au minimum le module MySQL)
- PHP disponible dans le PATH (`php -v` doit répondre)
- Composer (si besoin de réinstaller les dépendances)

---

## 3. Base de données

### 3.1 Configuration actuelle (`.env`)

```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=klebe_plan_pro
DB_USERNAME=root
DB_PASSWORD=
```

C'est la configuration par défaut d'un MySQL XAMPP fraîchement installé
(utilisateur `root`, sans mot de passe). Si votre MySQL a un mot de passe
root différent, mettez-le à jour dans `DB_PASSWORD`.

### 3.2 Fichier `klebe_plan_pro.sql`

Un export complet de la base (structure + données de démo) se trouve à la
racine du projet : **`klebe_plan_pro.sql`**.

**Pour importer cette base sur une autre machine / un autre poste :**

Option A — via phpMyAdmin :
1. Ouvrir `http://localhost/phpmyadmin`
2. Créer une base nommée `klebe_plan_pro` (collation `utf8mb4_unicode_ci`)
3. Onglet "Importer" → choisir le fichier `klebe_plan_pro.sql` → Exécuter

Option B — en ligne de commande :
```
C:\xampp\mysql\bin\mysql.exe -u root -e "CREATE DATABASE klebe_plan_pro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
C:\xampp\mysql\bin\mysql.exe -u root klebe_plan_pro < klebe_plan_pro.sql
```

### 3.3 Reconstruire la base à partir des migrations (alternative)

Si vous préférez repartir de zéro plutôt que d'importer le `.sql` :

```
php artisan migrate:fresh
php artisan db:seed --class=DemoSeeder
```

### 3.4 Tables

| Table       | Contenu |
|-------------|---------|
| `entreprises` | Une entreprise cliente : plan (essentiel/business), quota mensuel, quota utilisé, packs supplémentaires |
| `users`       | Comptes (propriétaire ou assistante), rattachés à une entreprise |
| `rendez_vous` | Les RDV du DG : nom, date, heure, lieu, statut, notes, horodatage des 3 rappels envoyés |

Statuts possibles d'un rendez-vous (`rendez_vous.statut`) :
`planifie`, `confirme`, `reporte`, `annule`, `manque`, `termine`.

---

## 4. Comptes de démonstration

Ces comptes sont créés par `DemoSeeder` (entreprise "Cabinet Démo SARL",
plan business, 8 rendez-vous factices déjà générés).

| Rôle | Email | Mot de passe |
|------|-------|---------------|
| Propriétaire (DG / admin) | `proprietaire@demo.klebeplan.test` | `password` |
| Assistante | `assistante@demo.klebeplan.test` | `password` |

Le mot de passe `password` est défini dans `database/factories/UserFactory.php`
(hashé en base avec Laravel `Hash::make`). Pensez à changer ces comptes avant
toute mise en production.

---

## 5. Lancer le serveur

```
php artisan serve
```
→ API disponible sur `http://127.0.0.1:8000`

Pour que les rappels WhatsApp partent automatiquement, le scheduler Laravel
doit tourner en continu (voir section 7).

---

## 6. Routes API (`routes/api.php`)

Toutes les routes renvoient du JSON. Authentification par token Sanctum
(header `Authorization: Bearer {token}`), sauf `register` et `login`.

### Authentification (publique)
| Méthode | Route | Description |
|---|---|---|
| POST | `/api/register` | Créer un compte + entreprise |
| POST | `/api/login` | Se connecter, récupérer un token |

### Session (authentifié)
| Méthode | Route | Description |
|---|---|---|
| POST | `/api/logout` | Déconnexion (révoque le token) |
| GET  | `/api/me` | Infos de l'utilisateur connecté |

### Rendez-vous (authentifié, CRUD complet)
| Méthode | Route | Description |
|---|---|---|
| GET | `/api/rendez-vous` | Liste des RDV de l'entreprise |
| POST | `/api/rendez-vous` | Créer un RDV |
| GET | `/api/rendez-vous/{id}` | Détail d'un RDV |
| PUT/PATCH | `/api/rendez-vous/{id}` | Modifier un RDV |
| DELETE | `/api/rendez-vous/{id}` | Supprimer un RDV |

### Équipe (authentifié — gestion des assistantes)
| Méthode | Route | Description |
|---|---|---|
| GET | `/api/equipe` | Liste des membres de l'entreprise |
| POST | `/api/equipe` | Ajouter un membre |
| PATCH | `/api/equipe/{membre}/desactiver` | Désactiver un membre |
| PATCH | `/api/equipe/{membre}/reactiver` | Réactiver un membre |
| DELETE | `/api/equipe/{membre}` | Retirer un membre |

### Quota (authentifié, lecture seule)
| Méthode | Route | Description |
|---|---|---|
| GET | `/api/quota` | Quota mensuel : total, utilisé, restant |

---

## 7. Rappels WhatsApp automatiques

Commande artisan : `php artisan rappels:envoyer`
(fichier : `app/Console/Commands/EnvoyerRappelsWhatsApp.php`)

Elle vérifie, à chaque exécution, quels rendez-vous ont un rappel dû
**pile à ce moment** (veille 18h, jour J 8h, 15 min avant) et n'envoie
que ceux-là — en respectant le quota de messages de l'entreprise.

Le `Kernel` (`app/Console/Kernel.php`) programme cette commande pour
tourner **toutes les minutes** :

```php
$schedule->command('rappels:envoyer')
    ->everyMinute()
    ->withoutOverlapping()
    ->runInBackground();
```

**Pour que ça fonctionne en continu**, le scheduler Laravel doit être
lancé (localement, pour du dev) :

```
php artisan schedule:work
```

En production, on configure plutôt une tâche planifiée (cron / tâche
planifiée Windows) qui appelle `php artisan schedule:run` chaque minute.

---

## 8. Configuration WhatsApp (à compléter)

Dans `.env` :

```
WHATSAPP_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_API_VERSION=v21.0
```

Ces trois valeurs sont **vides pour l'instant**. Tant qu'elles ne sont
pas renseignées, `rappels:envoyer` tourne sans erreur mais n'envoie
aucun message réel (0 envoyés). Le service qui les utilise est
`app/Services/WhatsAppService.php`.

Pour les obtenir : créer une app WhatsApp Business sur Meta for
Developers, récupérer le token d'accès et l'ID du numéro de téléphone.

---

## 9. Gestion du quota

Chaque entreprise (`entreprises`) a :
- `quota_mensuel` : messages inclus dans son plan (Essentiel = 500, Business = 2 500)
- `quota_utilise` : messages déjà envoyés ce mois-ci
- `quota_packs_supplementaires` : nombre de packs de 100 messages achetés en plus
- `quota_reinitialise_le` : date de la prochaine remise à zéro du compteur

Quota restant = `quota_mensuel + (quota_packs_supplementaires × 100) − quota_utilise`
(voir `Entreprise::quotaRestant()` et `Entreprise::quotaAtteint()`).

Quand le quota est atteint, l'envoi est bloqué (visible dans le résultat
de `rappels:envoyer` : compteur "bloqués (quota)").

---

## 10. Commandes utiles (récap)

```
# Installer les dépendances
composer install

# Générer la clé d'application (si besoin)
php artisan key:generate

# Vider les caches de config (après modif du .env)
php artisan config:clear

# Rejouer les migrations depuis zéro + re-seed
php artisan migrate:fresh --seed --seeder=DemoSeeder

# Lancer le serveur de dev
php artisan serve

# Lancer le scheduler (rappels automatiques)
php artisan schedule:work

# Envoyer manuellement les rappels dus maintenant (test)
php artisan rappels:envoyer
```

---

## 11. Structure du code

```
app/
  Console/Commands/EnvoyerRappelsWhatsApp.php   → commande des 3 rappels
  Http/Controllers/Api/
    AuthController.php        → register / login / logout / me
    RendezVousController.php  → CRUD des rendez-vous
    TeamController.php        → gestion de l'équipe (assistantes)
    QuotaController.php       → lecture du quota
  Http/Requests/               → validation des formulaires (RDV, équipe, auth)
  Http/Resources/RendezVousResource.php  → format JSON des RDV
  Models/
    Entreprise.php   → plan, quota
    User.php          → propriétaire / assistante
    RendezVous.php    → statut, rappels envoyés
  Policies/RendezVousPolicy.php  → permissions par entreprise
  Services/WhatsAppService.php   → appel à l'API WhatsApp
database/
  migrations/   → structure des 3 tables
  factories/    → génération de données de test
  seeders/DemoSeeder.php  → jeu de données de démo
routes/api.php  → toutes les routes ci-dessus
klebe_plan_pro.sql  → export complet de la base MySQL (structure + données)
```

---

## 12. État actuel / à faire

✅ Fait :
- Squelette Laravel complet installé
- Migrations + modèles + contrôleurs + routes API (RDV, équipe, quota, auth)
- Base de données basculée sur MySQL (XAMPP), export `.sql` fourni à la racine
- Comptes de démo créés et fonctionnels

⏳ À faire :
- Renseigner les vraies credentials WhatsApp dans `.env`
- Vérifier/verrouiller les règles de calcul du quota et des packs
  (voir points soulevés dans l'analyse stratégique : prix des packs,
  ce qui consomme exactement une unité de quota)
- Ajouter les actions de suivi de RDV (confirmer, reporter, annuler)
  prévues pour la V1.x de la trajectoire produit
- Basculer `APP_DEBUG=false` et sécuriser le `.env` avant toute mise
  en production
