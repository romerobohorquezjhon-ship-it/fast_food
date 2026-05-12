<?php
include 'db.php';
header('Content-Type: application/json');
$action = $_GET['action'] ?? '';

// LOGIN
if ($action == 'login') {
    $data = json_decode(file_get_contents('php://input'), true);
    $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE nombre = ? AND password = ?");
    $stmt->execute([$data['user'], $data['pass']]);
    $user = $stmt->fetch();
    echo json_encode(['success' => !!$user, 'nombre' => $user['nombre'] ?? '']);
}

// REGISTRO
if ($action == 'register') {
    $data = json_decode(file_get_contents('php://input'), true);
    try {
        $sql = "INSERT INTO usuarios (nombre, apellidos, telefono, correo, password) VALUES (?, ?, ?, ?, ?)";
        $pdo->prepare($sql)->execute([$data['nombre'], $data['apellidos'], $data['telefono'], $data['correo'], $data['password']]);
        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => 'El correo o usuario ya existe']);
    }
}

// ENVIAR PEDIDO
if ($action == 'submit_order') {
    $data = json_decode(file_get_contents('php://input'), true);
    $sql = "INSERT INTO pedidos (numero, mesa, mesero, items, notas, hora, estado, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    $pdo->prepare($sql)->execute([
        $data['numero'], $data['mesa'], $data['mesero'], json_encode($data['items']), 
        $data['notas'], $data['hora'], $data['estado'], $data['timestamp']
    ]);
    echo json_encode(['success' => true]);
}

// OBTENER PEDIDOS
if ($action == 'get_orders') {
    $stmt = $pdo->query("SELECT * FROM pedidos ORDER BY timestamp DESC");
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach($orders as &$o) { $o['items'] = json_decode($o['items']); }
    echo json_encode($orders);
}

// ACTUALIZAR ESTADO
if ($action == 'update_status') {
    $data = json_decode(file_get_contents('php://input'), true);
    $pdo->prepare("UPDATE pedidos SET estado = ? WHERE id = ?")->execute([$data['nuevoEstado'], $data['id']]);
    echo json_encode(['success' => true]);
}
?>