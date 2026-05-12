<?php
// ============================================================
// FAST FOOD SERVICE — Script de Instalación
// ============================================================
// Accede a: http://localhost/fast_food/setup.php

$host = "localhost";
$user = "root";
$pass = "";

try {
    $pdo = new PDO("mysql:host=$host;charset=utf8mb4", $user, $pass);
    
    // 1. Crear base de datos
    $pdo->exec("CREATE DATABASE IF NOT EXISTS fast_food_db");
    
    // 2. Seleccionar BD
    $pdo->exec("USE fast_food_db");
    
    // 3. Crear tabla usuarios
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS usuarios (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nombre VARCHAR(100) NOT NULL UNIQUE,
            apellidos VARCHAR(150),
            telefono VARCHAR(20),
            correo VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            fechaRegistro DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_nombre (nombre),
            INDEX idx_correo (correo)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    
    // 4. Crear tabla pedidos
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS pedidos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            numero VARCHAR(10) NOT NULL,
            mesa VARCHAR(50),
            mesero VARCHAR(100),
            items JSON,
            notas TEXT,
            hora VARCHAR(20),
            estado VARCHAR(50) DEFAULT 'pendiente',
            timestamp BIGINT,
            horaDespacho VARCHAR(20),
            fechaCreacion DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_estado (estado),
            INDEX idx_mesa (mesa)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    
    echo "✅ Base de datos creada exitosamente!<br><br>";
    echo "📊 Tablas creadas:<br>";
    echo "• usuarios<br>";
    echo "• pedidos<br><br>";
    echo "🚀 Ahora puedes acceder a: <a href='index.html'>Login</a>";
    
} catch (PDOException $e) {
    echo "❌ Error: " . $e->getMessage();
}
?>
