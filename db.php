<?php
// ============================================================
// FAST FOOD SERVICE — Configuración de Base de Datos
// ============================================================

$host = "localhost";
$user = "root";           // Usuario por defecto de XAMPP
$pass = "";               // Contraseña por defecto vacía (XAMPP)
$db   = "fast_food_db";

// Crear conexión PDO
try {
    $pdo = new PDO(
        "mysql:host=$host;dbname=$db;charset=utf8mb4",
        $user,
        $pass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    die(json_encode([
        'success' => false,
        'error' => 'Error de conexión a BD: ' . $e->getMessage()
    ]));
}
?>
