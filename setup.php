<?php
// ============================================================
// FAST FOOD SERVICE — Script de Instalación
// ============================================================
// Accede a: http://localhost/fast_food/setup.php

$host = "localhost";
$user = "root";
$pass = "";

echo "<!DOCTYPE html>
<html lang='es'>
<head>
    <meta charset='UTF-8'>
    <title>FastFood - Instalación</title>
    <style>
        body { font-family: 'DM Sans', sans-serif; background: #0f172a; color: #fff; padding: 40px; text-align: center; }
        .container { max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 12px; padding: 30px; }
        .success { color: #059669; font-size: 24px; margin-bottom: 20px; }
        .error { color: #dc2626; font-size: 24px; margin-bottom: 20px; }
        h1 { margin-top: 0; color: #06b6d4; }
        .info { background: #1a3a3a; border-left: 4px solid #06b6d4; padding: 15px; text-align: left; margin: 20px 0; border-radius: 6px; }
        a { color: #06b6d4; text-decoration: none; font-weight: bold; }
    </style>
</head>
<body>
<div class='container'>
    <h1>🍔 Fast Food Service</h1>
    <h2>Script de Instalación</h2>";

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
    
    echo "<div class='success'>✅</div>
    <h3>Base de datos creada exitosamente!</h3>
    <div class='info'>
        <strong>📊 Tablas creadas:</strong><br>
        • usuarios<br>
        • pedidos
    </div>
    <div class='info'>
        <strong>🚀 Próximos pasos:</strong><br>
        1. Accede a: <a href='index.html'>Ir al Login</a><br>
        2. Crea tu primera cuenta de empleado<br>
        3. ¡Comienza a usar el sistema!
    </div>";
    
} catch (PDOException $e) {
    echo "<div class='error'>❌</div>
    <h3>Error en la instalación</h3>
    <div class='info' style='border-left-color: #dc2626; background: #3a1a1a;'>
        <strong>Error:</strong><br>" . $e->getMessage() . "
    </div>
    <p>Verifica que:</p>
    <div class='info'>
        ✓ MySQL/XAMPP está corriendo<br>
        ✓ Usuario 'root' existe sin contraseña<br>
        ✓ El archivo db.php está en la misma carpeta
    </div>";
}

echo "</div>
</body>
</html>";
?>