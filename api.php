<?php
error_reporting(E_ALL);
ini_set('display_errors', 0);
inc_once 'db.php';
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

$action = $_GET['action'] ?? '';

// LOGIN
if ($action == 'login') {
    $data = json_decode(file_get_contents('php://input'), true);
    try {
        $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE nombre = ? AND password = ?");
        $stmt->execute([$data['user'], $data['pass']]);
        $user = $stmt->fetch();
        echo json_encode(['success' => !!$user, 'nombre' => $user['nombre'] ?? '']);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

// REGISTRO
if ($action == 'register') {
    $data = json_decode(file_get_contents('php://input'), true);
    try {
        $sql = "INSERT INTO usuarios (nombre, apellidos, telefono, correo, password) VALUES (?, ?, ?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $data['nombre'], 
            $data['apellidos'], 
            $data['telefono'], 
            $data['correo'], 
            $data['password']
        ]);
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        http_response_code(500);
        if (strpos($e->getMessage(), 'Duplicate') !== false) {
            echo json_encode(['success' => false, 'error' => 'El correo o nombre de usuario ya existe']);
        } else {
            echo json_encode(['success' => false, 'error' => 'Error al registrar: ' . $e->getMessage()]);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

// ENVIAR PEDIDO
if ($action == 'submit_order') {
    $data = json_decode(file_get_contents('php://input'), true);
    try {
        $sql = "INSERT INTO pedidos (numero, mesa, mesero, items, notas, hora, estado, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        $pdo->prepare($sql)->execute([
            $data['numero'], $data['mesa'], $data['mesero'], json_encode($data['items']), 
            $data['notas'], $data['hora'], $data['estado'], $data['timestamp']
        ]);
        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

// OBTENER PEDIDOS
if ($action == 'get_orders') {
    try {
        $stmt = $pdo->query("SELECT * FROM pedidos ORDER BY timestamp DESC");
        $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach($orders as &$o) { $o['items'] = json_decode($o['items']); }
        echo json_encode($orders);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

// ACTUALIZAR ESTADO
if ($action == 'update_status') {
    $data = json_decode(file_get_contents('php://input'), true);
    try {
        $pdo->prepare("UPDATE pedidos SET estado = ? WHERE id = ?")->execute([$data['nuevoEstado'], $data['id']]);
        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}
?>
