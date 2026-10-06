-- phpMyAdmin SQL Dump
-- version 5.2.2deb2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Jun 25, 2026 at 09:03 AM
-- Server version: 8.4.10-0ubuntu0.25.10.1
-- PHP Version: 8.4.11

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `evidentia_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `evidence_audit_logs`
--

CREATE TABLE `evidence_audit_logs` (
  `log_id` int NOT NULL,
  `evidence_id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `action_performed` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `previous_stage` varchar(150) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `new_stage` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `transferred_by` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `received_by` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `changed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `evidence_records`
--

CREATE TABLE `evidence_records` (
  `id` int NOT NULL,
  `evidence_id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `case_number` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `case_title` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `suspect_names` text COLLATE utf8mb4_general_ci,
  `witness_names` text COLLATE utf8mb4_general_ci,
  `investigating_agency` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `evidence_type` varchar(100) COLLATE utf8mb4_general_ci DEFAULT 'Digital Media Unit',
  `quantity` int DEFAULT '1',
  `unit_descriptor` text COLLATE utf8mb4_general_ci,
  `condition_received` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `collector_name` varchar(150) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `certified_by` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `noted_by` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `date_collected` date DEFAULT NULL,
  `collection_place` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `workflow_stage` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT 'On Field',
  `storage_vault` varchar(150) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `retrieval_address` text COLLATE utf8mb4_general_ci,
  `turned_over_by_name` varchar(150) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `turned_over_by_agency` varchar(150) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `received_by_name` varchar(150) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `received_by_agency` varchar(150) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `evidence_records`
--

INSERT INTO `evidence_records` (`id`, `evidence_id`, `case_number`, `case_title`, `suspect_names`, `witness_names`, `investigating_agency`, `evidence_type`, `quantity`, `unit_descriptor`, `condition_received`, `collector_name`, `certified_by`, `noted_by`, `date_collected`, `collection_place`, `workflow_stage`, `storage_vault`, `retrieval_address`, `turned_over_by_name`, `turned_over_by_agency`, `received_by_name`, `received_by_agency`, `created_at`) VALUES
(6, 'EV-6a3ca67563a85', 'SOCO-BCFU-26-0123-H', 'Homicide', 'Juan De La Cruz', 'Pepito, Pepita', 'Baguio City Police Office (BCPO) - Main', 'Physical Specimen', 3, 'Controlled Substance / Narcotics', 'Dangerous', 'The Officer Collector', 'The Team Leader', 'The Chief', '2026-06-25', '2nd Floor', 'On Field', 'Lab Locker', 'La Trinidad', 'The Officer Collector', 'BCPO, Baguio City', 'The Custodian', 'BCPO, Naguillan', '2026-06-25 03:54:29'),
(7, 'EV-6a3ceb1393333', 'SOCO-BCFU-26-0123-H', 'test', 'test', 'test, test, test', 'Baguio City Police Office (BCPO) - Main', 'Digital Media Unit', 1, 'Hard Drive (HDD)', 'test', 'test', 'test', 'test', NULL, 'test', 'On Field', 'test', 'test', 'test', 'test', 'test', 'test', '2026-06-25 08:47:15');

-- --------------------------------------------------------

--
-- Table structure for table `system_activity_audit`
--

CREATE TABLE `system_activity_audit` (
  `id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `action_type` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `description` text COLLATE utf8mb4_general_ci NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `system_activity_audit`
--

INSERT INTO `system_activity_audit` (`id`, `user_id`, `action_type`, `description`, `timestamp`) VALUES
(91, 1, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-22 15:57:51'),
(92, 2, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-22 16:31:25'),
(93, 1, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-22 16:37:01'),
(94, 2, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-22 17:05:42'),
(95, 1, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-22 17:14:31'),
(96, NULL, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-22 17:16:40'),
(97, 1, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-22 17:16:52'),
(98, 1, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-22 17:35:53'),
(99, 1, 'PASSWORD_RESET_REQUEST', 'A password recovery token link was successfully generated for username: admin', '2026-06-22 17:40:04'),
(100, 1, 'PASSWORD_RESET_REQUEST', 'A password recovery token link was successfully generated for username: admin', '2026-06-22 17:40:53'),
(101, 1, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-22 17:43:47'),
(102, 1, 'PASSWORD_RESET_REQUEST', 'A password recovery token link was successfully generated for username: admin', '2026-06-22 17:49:33'),
(103, 1, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-22 18:58:02'),
(104, 1, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-22 19:13:51'),
(105, 1, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-23 11:19:21'),
(106, 1, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-23 14:36:19'),
(107, 1, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-23 14:59:24'),
(108, 34, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-23 15:17:16'),
(109, 1, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-23 15:27:50'),
(110, 28, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-23 15:28:19'),
(111, 1, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-23 15:30:54'),
(112, 28, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-23 15:45:36'),
(113, 1, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-24 05:30:51'),
(114, 1, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-24 10:09:38'),
(115, 1, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-24 10:51:49'),
(116, 1, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-24 10:52:21'),
(117, 1, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-24 11:04:46'),
(118, 1, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-24 11:33:35'),
(119, 2, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-24 12:06:27'),
(120, 28, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-24 12:07:56'),
(121, 32, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-24 12:08:20'),
(122, 33, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-24 12:08:55'),
(123, 34, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-24 12:09:06'),
(124, 37, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-24 12:09:16'),
(125, 32, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-24 12:15:28'),
(126, 1, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-24 12:25:26'),
(127, 37, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-24 12:34:39'),
(128, 37, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-24 12:35:05'),
(129, 37, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-24 12:44:52'),
(130, 37, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-24 13:49:46'),
(131, 1, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-24 13:57:55'),
(132, 1, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-24 14:05:37'),
(133, 1, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-24 14:15:48'),
(134, 1, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-24 14:51:57'),
(135, NULL, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-24 15:04:53'),
(136, 1, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-24 15:05:23'),
(137, 1, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-24 15:14:51'),
(138, 1, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-24 15:18:20'),
(139, 1, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-24 15:19:01'),
(140, 32, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-24 17:51:45'),
(141, 1, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-24 18:18:32'),
(142, 1, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-25 02:42:13'),
(143, 1, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-25 04:44:35'),
(144, 1, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-25 05:34:45'),
(145, 34, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-25 05:35:46'),
(146, 34, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-25 05:42:49'),
(147, 1, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-25 06:36:32'),
(148, 1, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-25 06:36:52'),
(149, 32, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-25 06:37:32'),
(150, 1, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-25 06:41:14'),
(151, 32, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-25 06:41:27'),
(152, 2, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-25 06:41:43'),
(153, 28, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-25 06:42:19'),
(154, 2, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-25 06:42:37'),
(155, 32, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-25 06:43:00'),
(156, 33, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-25 06:43:22'),
(157, 34, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-25 06:43:49'),
(158, 1, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-25 06:44:02'),
(159, 37, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-25 06:44:38'),
(160, 32, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-25 06:45:42'),
(161, 33, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-25 06:46:14'),
(162, 1, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-25 07:00:48'),
(163, 37, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-25 07:01:29'),
(164, 1, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-25 07:19:25'),
(165, 37, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-25 08:19:26'),
(166, 37, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-25 08:19:41'),
(167, 37, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-25 08:20:09'),
(168, 1, 'USER_LOGIN', 'User account session successfully initialized for operator terminal access.', '2026-06-25 08:20:23');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `badge_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('admin','officer') COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_login_at` datetime DEFAULT NULL,
  `first_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Unknown',
  `last_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Unknown',
  `email_address` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `account_status` enum('active','suspended','archived') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `sub_role` enum('System Administrator','Evidence Custodian','Evidence Collector / Forensic Technician','Supervisor / Reviewer','Auditor') COLLATE utf8mb4_unicode_ci NOT NULL,
  `agency_rank_title` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'Operator',
  `department_division` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'Operations Division'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `badge_number`, `password_hash`, `role`, `created_at`, `last_login_at`, `first_name`, `last_name`, `email_address`, `contact_number`, `account_status`, `sub_role`, `agency_rank_title`, `department_division`) VALUES
(1, 'admin', NULL, 'admin', 'admin', '2026-06-20 00:32:18', NULL, 'Admin', 'Admin', 'amnekku@gmail.com', '01234567890', 'active', 'System Administrator', 'Operator', 'Operations Division'),
(2, 'officer', NULL, 'officer', 'officer', '2026-06-20 00:32:18', NULL, 'Officer', 'Officer', 'officer@gmail.com', '01234567890', 'active', 'Supervisor / Reviewer', 'Operator', 'Operations Division'),
(28, 'auditor', NULL, 'auditor', 'officer', '2026-06-22 02:47:10', NULL, 'Auditor', 'Auditor', 'auditor@gmail.com', '01234567890', 'active', 'Auditor', 'Operator', 'Operations Division'),
(32, 'raimel', NULL, 'raimel', 'admin', '2026-06-22 05:08:20', NULL, 'Raimel', 'Agaton', 'raimel.agaton@gmail.com', '01234567890', 'active', 'System Administrator', 'Operator', 'Operations Division'),
(33, 'custodian', NULL, 'custodian', 'officer', '2026-06-22 07:09:59', NULL, 'Custodian', 'Custodian', 'custodian@gmail.com', '01234567890', 'active', 'Evidence Custodian', 'Operator', 'Operations Division'),
(34, 'forensic', NULL, 'forensic', 'officer', '2026-06-22 14:53:47', NULL, 'Forensic', 'Technician', 'forensic.technician@gmail.com', '01234567890', 'active', 'Evidence Collector / Forensic Technician', 'Operator', 'Operations Division'),
(37, 'test', NULL, 'test', 'officer', '2026-06-24 07:00:28', NULL, 'test', 'test', 'test@gmail.com', '01234567890', 'active', 'Evidence Collector / Forensic Technician', 'Operator', 'Operations Division'),
(44, 'groot', NULL, 'groot', 'admin', '2026-06-25 08:22:15', NULL, 'Am', 'Groot', 'am.groot@gmail.com', '01234567890', 'active', 'System Administrator', 'Operator', 'Operations Division');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `evidence_audit_logs`
--
ALTER TABLE `evidence_audit_logs`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `evidence_id` (`evidence_id`);

--
-- Indexes for table `evidence_records`
--
ALTER TABLE `evidence_records`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `evidence_id` (`evidence_id`);

--
-- Indexes for table `system_activity_audit`
--
ALTER TABLE `system_activity_audit`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email_address` (`email_address`),
  ADD UNIQUE KEY `email_address_2` (`email_address`),
  ADD UNIQUE KEY `badge_number` (`badge_number`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `evidence_audit_logs`
--
ALTER TABLE `evidence_audit_logs`
  MODIFY `log_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `evidence_records`
--
ALTER TABLE `evidence_records`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `system_activity_audit`
--
ALTER TABLE `system_activity_audit`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=169;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=47;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `evidence_audit_logs`
--
ALTER TABLE `evidence_audit_logs`
  ADD CONSTRAINT `evidence_audit_logs_ibfk_1` FOREIGN KEY (`evidence_id`) REFERENCES `evidence_records` (`evidence_id`) ON DELETE CASCADE;

--
-- Constraints for table `system_activity_audit`
--
ALTER TABLE `system_activity_audit`
  ADD CONSTRAINT `system_activity_audit_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
