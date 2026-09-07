-- MariaDB dump 10.19  Distrib 10.4.28-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: klebe_plan_pro
-- ------------------------------------------------------
-- Server version	10.4.28-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `entreprises`
--

DROP TABLE IF EXISTS `entreprises`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `entreprises` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `nom` varchar(255) NOT NULL,
  `telephone_dg` varchar(255) NOT NULL COMMENT 'Numéro WhatsApp du DG qui reçoit les rappels',
  `nom_dg` varchar(255) DEFAULT NULL,
  `plan` enum('essentiel','business') NOT NULL DEFAULT 'essentiel',
  `plan_actif_jusqu_au` timestamp NULL DEFAULT NULL,
  `quota_mensuel` int(10) unsigned NOT NULL DEFAULT 500,
  `quota_utilise` int(10) unsigned NOT NULL DEFAULT 0,
  `quota_packs_supplementaires` int(10) unsigned NOT NULL DEFAULT 0 COMMENT 'Messages achetés en plus via des packs (100 messages / pack)',
  `quota_reinitialise_le` timestamp NULL DEFAULT NULL COMMENT 'Date du prochain reset mensuel du quota',
  `actif` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `entreprises`
--

LOCK TABLES `entreprises` WRITE;
/*!40000 ALTER TABLE `entreprises` DISABLE KEYS */;
INSERT INTO `entreprises` VALUES (1,'Cabinet Démo SARL','+229613940312','Hettie Okuneva','business','2026-09-26 15:00:12',500,0,0,'2026-08-31 23:00:00',1,'2026-08-26 15:00:12','2026-08-26 15:00:12');
/*!40000 ALTER TABLE `entreprises` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `migrations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES (1,'2026_08_23_000001_create_entreprises_table',1),(2,'2026_08_23_000002_create_users_table',1),(3,'2026_08_23_000003_create_rendez_vous_table',1);
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `personal_access_tokens`
--

DROP TABLE IF EXISTS `personal_access_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `personal_access_tokens`
--

LOCK TABLES `personal_access_tokens` WRITE;
/*!40000 ALTER TABLE `personal_access_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `personal_access_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rendez_vous`
--

DROP TABLE IF EXISTS `rendez_vous`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `rendez_vous` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `entreprise_id` bigint(20) unsigned NOT NULL,
  `cree_par_id` bigint(20) unsigned NOT NULL,
  `nom` varchar(255) NOT NULL,
  `date` date NOT NULL,
  `heure` time NOT NULL,
  `lieu` varchar(255) DEFAULT NULL,
  `statut` enum('planifie','confirme','reporte','annule','manque','termine') NOT NULL DEFAULT 'planifie',
  `rappel_veille_envoye_a` timestamp NULL DEFAULT NULL,
  `rappel_jour_j_envoye_a` timestamp NULL DEFAULT NULL,
  `rappel_15min_envoye_a` timestamp NULL DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL COMMENT 'Suppression douce: on garde l''historique des RDV supprimés',
  PRIMARY KEY (`id`),
  KEY `rendez_vous_cree_par_id_foreign` (`cree_par_id`),
  KEY `rendez_vous_entreprise_id_date_index` (`entreprise_id`,`date`),
  KEY `rendez_vous_entreprise_id_statut_index` (`entreprise_id`,`statut`),
  CONSTRAINT `rendez_vous_cree_par_id_foreign` FOREIGN KEY (`cree_par_id`) REFERENCES `users` (`id`),
  CONSTRAINT `rendez_vous_entreprise_id_foreign` FOREIGN KEY (`entreprise_id`) REFERENCES `entreprises` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rendez_vous`
--

LOCK TABLES `rendez_vous` WRITE;
/*!40000 ALTER TABLE `rendez_vous` DISABLE KEYS */;
INSERT INTO `rendez_vous` VALUES (1,1,2,'RDV avec Bernier and Sons','2026-09-07','05:26:00','73649 Abernathy Points Apt. 347\nAudreymouth, ID 03159','planifie',NULL,NULL,NULL,NULL,'2026-08-26 15:00:12','2026-08-26 15:00:12',NULL),(2,1,2,'RDV avec Runolfsson Group','2026-09-02','18:40:00','42248 Lance Islands Apt. 976\nEleonoreton, SC 81640-2840','planifie',NULL,NULL,NULL,NULL,'2026-08-26 15:00:12','2026-08-26 15:00:12',NULL),(3,1,2,'RDV avec Boyle-Kertzmann','2026-09-02','11:10:00','21054 Queen Manor Suite 093\nPort Ryanburgh, MO 57365','planifie',NULL,NULL,NULL,'Quia incidunt qui est.','2026-08-26 15:00:12','2026-08-26 15:00:12',NULL),(4,1,2,'RDV avec Sipes-Zieme','2026-09-05','12:08:00','981 Maurice Greens Apt. 912\nWest Parisville, ID 43706','planifie',NULL,NULL,NULL,NULL,'2026-08-26 15:00:12','2026-08-26 15:00:12',NULL),(5,1,2,'RDV avec Maggio-Aufderhar','2026-08-27','06:07:00','9742 Susan Camp Suite 310\nCormierbury, CT 42468','planifie',NULL,NULL,NULL,'Animi neque reiciendis facere illo neque quas architecto deserunt.','2026-08-26 15:00:12','2026-08-26 15:00:12',NULL),(6,1,2,'RDV avec Nolan, Conn and Renner','2026-09-09','18:13:00','449 Koelpin Branch\nPort Kara, MD 22858-2814','planifie',NULL,NULL,NULL,'Dicta neque ut nulla expedita.','2026-08-26 15:00:12','2026-08-26 15:00:12',NULL),(7,1,2,'RDV avec Mann, Littel and Sanford','2026-09-03','14:23:00','97377 Ines Vista\nErwinhaven, OR 13858','planifie',NULL,NULL,NULL,'Dolorem deserunt ea voluptas eum quos.','2026-08-26 15:00:12','2026-08-26 15:00:12',NULL),(8,1,2,'RDV avec Satterfield-Parisian','2026-09-01','20:06:00','9413 Will Forks Apt. 390\nNorth Jailyn, VA 65291','planifie',NULL,NULL,NULL,'Distinctio beatae iusto et mollitia consectetur et.','2026-08-26 15:00:12','2026-08-26 15:00:12',NULL);
/*!40000 ALTER TABLE `rendez_vous` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `entreprise_id` bigint(20) unsigned NOT NULL,
  `nom` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `telephone` varchar(255) DEFAULT NULL,
  `role` enum('proprietaire','assistante') NOT NULL DEFAULT 'assistante',
  `actif` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'Permet de désactiver une assistante sans la supprimer',
  `remember_token` varchar(100) DEFAULT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`),
  KEY `users_entreprise_id_foreign` (`entreprise_id`),
  CONSTRAINT `users_entreprise_id_foreign` FOREIGN KEY (`entreprise_id`) REFERENCES `entreprises` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,1,'Josephine (Démo Propriétaire)','proprietaire@demo.klebeplan.test','$2y$12$lH4zn8cxprMGU0IxvvKHs.I9EsIYZd/NaFHTPbAOomMb3OH3LlmQ.','+229662581809','proprietaire',1,'yrhQN4LD8C','2026-08-26 15:00:12','2026-08-26 15:00:12','2026-08-26 15:00:12'),(2,1,'Assistante Démo','assistante@demo.klebeplan.test','$2y$12$lH4zn8cxprMGU0IxvvKHs.I9EsIYZd/NaFHTPbAOomMb3OH3LlmQ.','+229671804573','assistante',1,'gCkest6HSw','2026-08-26 15:00:12','2026-08-26 15:00:12','2026-08-26 15:00:12');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'klebe_plan_pro'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-26 17:18:06
