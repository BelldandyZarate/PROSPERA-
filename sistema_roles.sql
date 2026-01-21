-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 21-01-2026 a las 06:28:43
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `sistema_roles`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `permisos`
--

CREATE TABLE `permisos` (
  `id` int(11) NOT NULL,
  `rol` varchar(50) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `permisos` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`permisos`)),
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `permisos`
--

INSERT INTO `permisos` (`id`, `rol`, `descripcion`, `permisos`, `creado_en`) VALUES
(1, 'superadministrador', 'Acceso completo a todo el sistema', '[\"ver_dashboard\", \"gestion_usuarios\", \"gestion_roles\", \"ver_reportes\", \"config_sistema\", \"modificar_contenido\", \"ver_registros\", \"generar_reportes\", \"acceso_total\"]', '2026-01-17 06:40:41'),
(2, 'administrador', 'Administrador general del sistema', '[\"ver_dashboard\", \"gestion_usuarios\", \"ver_reportes\", \"modificar_contenido\", \"ver_registros\"]', '2026-01-17 06:40:41'),
(3, 'punto_venta', 'Usuario de punto de venta', '[\"registrar_ventas\", \"ver_inventario\", \"generar_tickets\", \"ver_reportes_ventas\"]', '2026-01-17 06:40:41'),
(4, 'registrador', 'Registra nuevos beneficiarios', '[\"registrar_beneficiarios\", \"ver_registros\", \"actualizar_datos\"]', '2026-01-17 06:40:41'),
(5, 'consultoria', 'Realiza consultorías', '[\"ver_consultas\", \"generar_reportes\", \"ver_dashboard_consultor\"]', '2026-01-17 06:40:41'),
(6, 'beneficiario', 'Beneficiario del sistema', '[\"ver_mis_datos\", \"actualizar_perfil\", \"ver_beneficios\"]', '2026-01-17 06:40:41'),
(7, 'contenido', 'Gestiona contenido del sistema', '[\"modificar_contenido\", \"subir_archivos\", \"gestion_categorias\"]', '2026-01-17 06:40:41');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `refresh_tokens`
--

CREATE TABLE `refresh_tokens` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `token` varchar(500) NOT NULL,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `revoked` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `refresh_tokens`
--

INSERT INTO `refresh_tokens` (`id`, `usuario_id`, `token`, `expires_at`, `created_at`, `revoked`) VALUES
(1, 2, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzY4ODQ4NjA0LCJleHAiOjE3Njk0NTM0MDR9.pR3l9oVgKxRzTZyrC-qCt-e-KOaqwqoc9a9l7DWwdck', '2026-01-19 18:50:25', '2026-01-19 18:50:04', 1),
(2, 2, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzY4ODQ4NjE4LCJleHAiOjE3Njk0NTM0MTh9.m92Pspg_6FtWon-o3sk5eX49XEAL4EH--66_aHnJtR4', '2026-01-19 18:50:25', '2026-01-19 18:50:18', 1),
(3, 2, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzY4ODQ4NjMzLCJleHAiOjE3Njk0NTM0MzN9.NeuW2LDg3qLo3jWCTBnFhYC8P4On3EgOyuk5fRRoq90', '2026-01-19 18:54:12', '2026-01-19 18:50:33', 1),
(4, 2, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzY4ODQ4ODQxLCJleHAiOjE3Njk0NTM2NDF9.JNfD5us6xuDID7Jr3Vc0Xz9kkPy8BJh11jAzmjRumxM', '2026-01-19 18:54:12', '2026-01-19 18:54:01', 1),
(5, 2, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzY4ODQ4ODYyLCJleHAiOjE3Njk0NTM2NjJ9.wkz9M5PUpZJvKLbRr4kxm2s3WruRcPzDdZMn84kNCtI', '2026-01-19 20:01:35', '2026-01-19 18:54:22', 1),
(6, 2, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzY4ODQ5MTA5LCJleHAiOjE3Njk0NTM5MDl9.N_wxWXYSN67wu7L9aSRhLy_0w9VOTyTvK9BJ_h2ooBk', '2026-01-19 20:01:35', '2026-01-19 18:58:29', 1),
(7, 2, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzY4ODQ5MTk0LCJleHAiOjE3Njk0NTM5OTR9.S1_TuPob1RFwWuPpzi46gvqagxDUeeAzn4mcOoQ-RqU', '2026-01-19 20:01:35', '2026-01-19 18:59:54', 1),
(8, 2, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzY4ODUwNzE5LCJleHAiOjE3Njk0NTU1MTl9.ARCKSNuoHB1ZYObBTauyObnzobeZCkf3xpKb7DJD6tE', '2026-01-19 20:01:35', '2026-01-19 19:25:19', 1),
(9, 2, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzY4ODUwNzUwLCJleHAiOjE3Njk0NTU1NTB9.DSLKfhj9z4NLK8TqDFztR6C8YWoXlsjxxoZF5_rVocI', '2026-01-19 20:01:35', '2026-01-19 19:25:50', 1),
(10, 2, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzY4ODUyNDcwLCJleHAiOjE3Njk0NTcyNzB9.IViSrFUufCGWpo3GNQwE21hzUrl2um5dPfBXTDeHDgc', '2026-01-19 20:01:35', '2026-01-19 19:54:30', 1),
(11, 2, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzY4ODUyODUxLCJleHAiOjE3Njk0NTc2NTF9.HRnzMnTX6b1A5T8yrQZpOYCWK3dnkL2oQzlxlaXh_ks', '2026-01-19 20:01:35', '2026-01-19 20:00:51', 1),
(12, 2, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzY4ODUyODYxLCJleHAiOjE3Njk0NTc2NjF9.64IHb-o2x7EdbpX-8M6uPHFLoRfNFZ8paiqc1Onxrtg', '2026-01-19 20:01:35', '2026-01-19 20:01:01', 1),
(13, 2, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzY4ODUyODc1LCJleHAiOjE3Njk0NTc2NzV9.QroA-d-g1aGHjo17OeItS3oAJmgg7sb6KJvAOa6fq5Y', '2026-01-19 20:01:35', '2026-01-19 20:01:15', 1),
(14, 3, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzY4ODUyOTY0LCJleHAiOjE3Njk0NTc3NjR9.84hhar-l4WHfC3IxpQfhnWuZ3phZgQ99qbMC-c-VFQg', '2026-01-19 20:03:00', '2026-01-19 20:02:44', 1),
(15, 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzY4ODUzMDMwLCJleHAiOjE3Njk0NTc4MzB9.n8bc3afI-Op0sXMSnbNzqz8KJQBErgVmSDkjp3ke7fs', '2026-01-19 20:03:55', '2026-01-19 20:03:50', 1),
(16, 5, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzY4ODUzMTM0LCJleHAiOjE3Njk0NTc5MzR9.Egy8cikCWzdmcttvh_3M83X-PcmKToidr2bMdZuqHvE', '2026-01-19 20:05:46', '2026-01-19 20:05:34', 1),
(17, 6, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjYsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzY4ODUzMTk2LCJleHAiOjE3Njk0NTc5OTZ9.f9CIbqdPVuKx5QJKW0jxO1SxOBt80Dz-z0InNzrxu98', '2026-01-19 20:06:43', '2026-01-19 20:06:36', 1),
(18, 3, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzY4OTYzNzA3LCJleHAiOjE3Njk1Njg1MDd9.MSTfGY9uODL56Z2Ab1IicSJ5QphSls_pxM59lzpN0pI', '2026-01-21 03:12:46', '2026-01-21 02:48:27', 1),
(19, 7, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjcsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzY4OTY0NDQ5LCJleHAiOjE3Njk1NjkyNDl9.uakvANph4_pGMDImqjaVgvgMpfjo_tN-PFD6tdzUb08', '2026-01-21 03:00:54', '2026-01-21 03:00:49', 1),
(20, 8, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjgsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzY4OTY0NTA5LCJleHAiOjE3Njk1NjkzMDl9.aVIOuOeYLW75guIKvrW2PQmToy5tHUN1M4EqbcYADKE', '2026-01-21 03:12:18', '2026-01-21 03:01:49', 1),
(21, 3, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzY4OTY1MTUwLCJleHAiOjE3Njk1Njk5NTB9.VhL4nU5gR5_fkpVDbZQkTSq_VT9VJtrusLoIFx6a7Nc', '2026-01-21 03:12:46', '2026-01-21 03:12:30', 1),
(22, 2, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzY4OTY1MTc1LCJleHAiOjE3Njk1Njk5NzV9.cP-oVY_YXyxfoBwwzWixbllD9c1TgMSfiNB34v3_ktk', '2026-01-21 03:17:45', '2026-01-21 03:12:55', 1),
(23, 3, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzY4OTY1NDcwLCJleHAiOjE3Njk1NzAyNzB9.7KpHWDp81D2_kMSlowG6oD7twomie79_H_1yWoKgRP8', '2026-01-21 03:51:24', '2026-01-21 03:17:50', 1),
(24, 3, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzY4OTY2OTkzLCJleHAiOjE3Njk1NzE3OTN9.Ko2ilt_CYClGrfdXJHywpPIFPWLJnDiM34pQhMKfcfw', '2026-01-21 03:51:24', '2026-01-21 03:43:13', 1),
(25, 3, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzY4OTY3NDY2LCJleHAiOjE3Njk1NzIyNjZ9.C_NqZZli5KYxuXGOrNsAqZSpw1UdniFSEPqXpJ0fkHQ', '2026-01-21 03:51:24', '2026-01-21 03:51:06', 1),
(26, 2, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzY4OTY3NDkxLCJleHAiOjE3Njk1NzIyOTF9.FC0hMFy9w_0nZR3SxCZtuRZNvoFFMt50j7Ha4udNVQ0', '2026-01-21 03:51:49', '2026-01-21 03:51:31', 1),
(27, 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzY4OTY3NTQ5LCJleHAiOjE3Njk1NzIzNDl9.TDUQwxwsilEuAiqcmTQ177J4glVzpxLdEQUYn3kdw58', '2026-01-21 04:12:44', '2026-01-21 03:52:29', 1),
(28, 3, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzY4OTY3Nzg4LCJleHAiOjE3Njk1NzI1ODh9.CuVqp5sSjtHQLOKZmh2Ho6p3G4qK4-l7hrokE-9_6go', '2026-01-21 04:11:24', '2026-01-21 03:56:28', 1),
(29, 3, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzY4OTY3OTI0LCJleHAiOjE3Njk1NzI3MjR9.fxpkf29qHDdQVEmF9KZttYScvE7diDJRTAWlLcBw7Ys', '2026-01-21 04:11:24', '2026-01-21 03:58:44', 1),
(30, 3, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzY4OTY4MTM0LCJleHAiOjE3Njk1NzI5MzR9.gTMOGMUm12VSWJt1u7l-t3LbfQXkCqT-kfO8BBrjbrs', '2026-01-21 04:11:24', '2026-01-21 04:02:14', 1),
(31, 2, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzY4OTY4MjMzLCJleHAiOjE3Njk1NzMwMzN9.M-0aIMyhPB77VK-mpASHdsBAw4D52dQRmYoWrAc5eAg', '2026-01-21 04:04:29', '2026-01-21 04:03:53', 1),
(32, 3, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzY4OTY4NjM3LCJleHAiOjE3Njk1NzM0Mzd9.quSo5dpRsIByFnxePx219MMup40afunu_PYlilFyucM', '2026-01-21 04:11:24', '2026-01-21 04:10:37', 1),
(33, 2, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzY4OTY4NjkxLCJleHAiOjE3Njk1NzM0OTF9.Es3ow_baqRZPuyacuZpvDqOo5-mFDXQXmXmGGaWH2Pg', '2026-01-21 04:11:52', '2026-01-21 04:11:31', 1),
(34, 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzY4OTY4NzI5LCJleHAiOjE3Njk1NzM1Mjl9.8tFIFp2I_sfY2i8u1J_7RJj27LBbqh7TZDBmvMVvhbc', '2026-01-21 04:12:44', '2026-01-21 04:12:09', 1),
(35, 5, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzY4OTY4NzgzLCJleHAiOjE3Njk1NzM1ODN9.YyKHIQtt7A09rbnMc2hqUvrLYkZnKq_TYv0QdL0yhkk', '2026-01-21 04:13:13', '2026-01-21 04:13:03', 1),
(36, 6, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjYsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzY4OTY4ODA3LCJleHAiOjE3Njk1NzM2MDd9.-BORWcElDeacfsPCevy2IpvPkgW1TtIBGpr5hun73vc', '2026-01-21 04:13:36', '2026-01-21 04:13:27', 1),
(37, 7, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjcsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzY4OTY4ODI1LCJleHAiOjE3Njk1NzM2MjV9.-ndaaYbQ12X8Z5L_2Wk_y2nIhB9I-8y7mF_RyjnfuFc', '2026-01-21 04:14:00', '2026-01-21 04:13:45', 1),
(38, 8, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjgsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzY4OTY4ODQ5LCJleHAiOjE3Njk1NzM2NDl9.7G1gzquavSeOUm9sADv_lV2JmwDZAmdUbOMXEaFjJAY', '2026-01-21 04:17:25', '2026-01-21 04:14:09', 1),
(39, 5, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzY4OTY5MDUyLCJleHAiOjE3Njk1NzM4NTJ9.OLuoYfSsaTtHSuIZ6v4grnJhbVheP71MGiy3USZLJbM', '2026-01-21 04:33:06', '2026-01-21 04:17:32', 1),
(40, 5, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzY4OTY5MDkyLCJleHAiOjE3Njk1NzM4OTJ9.kNZEoQt223BGWQfzHY4lvnr-0eu1cYn9sxpuW0im9z4', '2026-01-21 04:33:06', '2026-01-21 04:18:12', 1),
(41, 5, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzY4OTY5NDU4LCJleHAiOjE3Njk1NzQyNTh9.pvNtcbkjXmMP3zkgy09bNkrZWnhHAU3xrUtkU_1RrbU', '2026-01-21 04:33:06', '2026-01-21 04:24:18', 1),
(42, 3, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzY4OTY5OTkxLCJleHAiOjE3Njk1NzQ3OTF9.Fy3QmaS7YqDiDLaLOmTTZ_dazAggK0kTGztSCl5ABlA', '2026-01-21 04:55:30', '2026-01-21 04:33:11', 1),
(43, 5, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzY4OTcxMDU5LCJleHAiOjE3Njk1NzU4NTl9.LFaOcsDA38zEI-9SSigcwagHKhKjk5TjDbFFy4C9dXc', '2026-01-21 05:00:35', '2026-01-21 04:50:59', 1),
(44, 5, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzY4OTcxMTgzLCJleHAiOjE3Njk1NzU5ODN9.fgl-IDGvHZEnyHosqHrRBdKHDPfUuu5H4iV8fcw3qTk', '2026-01-21 05:00:35', '2026-01-21 04:53:03', 1),
(45, 3, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzY4OTcxMzI1LCJleHAiOjE3Njk1NzYxMjV9.eaqB8Gy6cjnZC_Tvng9NWBtIYHx798AJSz_tP5Vur-o', '2026-01-21 04:55:30', '2026-01-21 04:55:25', 1),
(46, 5, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzY4OTcxMzM3LCJleHAiOjE3Njk1NzYxMzd9.HLJmZAj5HOW6WLV7e31Uo71er1G6koj2t421PhrxYCE', '2026-01-21 05:00:35', '2026-01-21 04:55:37', 1),
(47, 3, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzY4OTcxNjQxLCJleHAiOjE3Njk1NzY0NDF9.f5Gf7PqCtctGosaU0hET4YaQa1Z1jCSIi4_7ngwwjbU', '2026-01-21 05:00:49', '2026-01-21 05:00:41', 1),
(48, 5, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzY4OTcxNjU2LCJleHAiOjE3Njk1NzY0NTZ9.n3WTLysl3hdnkqphlgRwSf1slN9a1hMMubUxaGht2PQ', '2026-01-28 05:00:56', '2026-01-21 05:00:56', 0);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `nombre_completo` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `rol` enum('superadministrador','administrador','punto_venta','registrador','consultoria','beneficiario','contenido') NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `direccion` text DEFAULT NULL,
  `fecha_registro` timestamp NOT NULL DEFAULT current_timestamp(),
  `ultimo_login` timestamp NULL DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `token_verificacion` varchar(255) DEFAULT NULL,
  `verificado` tinyint(1) DEFAULT 0,
  `avatar` varchar(255) DEFAULT 'default.png'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `nombre_completo`, `email`, `password`, `rol`, `telefono`, `direccion`, `fecha_registro`, `ultimo_login`, `activo`, `token_verificacion`, `verificado`, `avatar`) VALUES
(2, 'Alan Gabriel Aguilar Snachez', 'alan@gmail.com', '$2a$10$RJX1RvQsISbXjzSX1luUnebZO0U1c5GQ4JxJL/RRqWe8cQywVyl/K', 'superadministrador', NULL, NULL, '2026-01-19 04:11:38', NULL, 1, NULL, 1, 'default.png'),
(3, 'Michelle Belldandy Gutierrez Zarate', 'bell@gmail.com', '$2a$10$XKHTjD6xBbkDJHRJ74LpTuXFLA3Pl8swwolrgwQKCeDrOOo9sDfqq', 'administrador', NULL, NULL, '2026-01-19 20:02:35', NULL, 1, NULL, 0, 'default.png'),
(4, 'Paola Salas Rosales', 'pao@gmail.com', '$2a$10$aAXCf3eioNBBWV/c0R1MwOvwoaHXBDlP/v/F52sjL5LPz3/yeV/h.', 'beneficiario', NULL, NULL, '2026-01-19 20:03:40', NULL, 1, NULL, 0, 'default.png'),
(5, 'Jaziel', 'jaziel@gmail.com', '$2a$10$0vKKPJoD7mF7jUrhMK9mBesUjkMH/DHmv/olpYsqpZfRqnB74G5dO', 'punto_venta', NULL, NULL, '2026-01-19 20:05:25', NULL, 1, NULL, 0, 'default.png'),
(6, 'Roxana Vilchis', 'roxana@gmail.com', '$2a$10$pVXe/yiLb/jWOxMdX98hzeCFD4Z6CcU94uZ6LZmIrpdbvd2x.1LnW', 'registrador', NULL, NULL, '2026-01-19 20:06:28', NULL, 1, NULL, 0, 'default.png'),
(7, 'ximena', 'ximena@gmail.com', '$2a$10$f2lhh5NbhQKWPYtVqSG.mugO6n69N2GjswuHZQBBWTxyyNHiamS9m', 'contenido', NULL, NULL, '2026-01-21 03:00:36', NULL, 1, NULL, 0, 'default.png'),
(8, 'ELSA MARIA LUISA GALINDO BERTAUD', 'elsa@gmail.com', '$2a$10$oYMA1s89AZNRMqMHJPYUQuKjSz4vWUDO72dDQ3HrMsw88SM6S2tsC', 'consultoria', NULL, NULL, '2026-01-21 03:01:35', NULL, 1, NULL, 0, 'default.png');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuario_avatars`
--

CREATE TABLE `usuario_avatars` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `avatar_filename` varchar(255) NOT NULL,
  `avatar_url` varchar(500) DEFAULT NULL,
  `es_actual` tinyint(1) DEFAULT 0,
  `fecha_subida` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `permisos`
--
ALTER TABLE `permisos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `rol` (`rol`);

--
-- Indices de la tabla `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_token` (`token`),
  ADD KEY `idx_usuario` (`usuario_id`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indices de la tabla `usuario_avatars`
--
ALTER TABLE `usuario_avatars`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `permisos`
--
ALTER TABLE `permisos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=49;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `usuario_avatars`
--
ALTER TABLE `usuario_avatars`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  ADD CONSTRAINT `refresh_tokens_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `usuario_avatars`
--
ALTER TABLE `usuario_avatars`
  ADD CONSTRAINT `usuario_avatars_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

DELIMITER $$
--
-- Eventos
--
CREATE DEFINER=`root`@`localhost` EVENT `cleanup_expired_tokens` ON SCHEDULE EVERY 1 DAY STARTS '2026-01-19 12:48:56' ON COMPLETION NOT PRESERVE ENABLE DO BEGIN
    DELETE FROM refresh_tokens 
    WHERE expires_at < NOW() OR revoked = TRUE;
END$$

DELIMITER ;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
