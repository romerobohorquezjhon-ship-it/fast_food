<?php
$host = "localhost";
$user = "root"; // Usuario por defecto de XAMPP
$pass = "";     // Contraseña por defecto vacía
$db   = "fast_food_db";

$conexion = mysqli_connect("localhost", "usuario", "password", "nombre_bd");
if (!$conexion) {
    die("Error de conexión: " . mysqli_connect_error());
}
?>
