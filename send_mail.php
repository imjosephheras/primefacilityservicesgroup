<?php
// HABILITAR CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Manejar preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Cargar configuración SMTP, clase mailer y DB
require_once 'smtp_config.php';
require_once 'smtp_mailer.php';
require_once 'db_config.php';

// CONFIGURACIÓN DEL MAIL
$to = EMAIL_TO; // Puede ser uno o varios emails separados por coma
$subject = "Nuevo mensaje desde el formulario de contacto";

// Log de destinatarios
$recipients = is_array($to) ? $to : explode(',', $to);
error_log("Destinatarios configurados: " . implode(', ', array_map('trim', $recipients)));

// RECIBIR LOS DATOS DEL FORM
$raw_input = file_get_contents("php://input");
$data = json_decode($raw_input, true);

// LOG para debug
error_log("=== SEND_MAIL DEBUG ===");
error_log("Raw input: " . $raw_input);
error_log("Decoded data: " . print_r($data, true));

// VALIDAR QUE SE RECIBIERON DATOS
if (!$data) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => "No se recibieron datos. Input recibido: " . substr($raw_input, 0, 100)
    ]);
    exit();
}

$name = $data["fullName"] ?? "";
$company = $data["company"] ?? "";
$email = $data["email"] ?? "";
$phone = $data["phone"] ?? "";
$service = $data["service"] ?? "";
$frequency = $data["frequency"] ?? "";
$propertyType = $data["propertyType"] ?? "";
$message = $data["message"] ?? "";

// VALIDAR CAMPOS REQUERIDOS (solo nombre y email son obligatorios)
if (empty($name) || empty($email)) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => "Nombre y email son campos requeridos"
    ]);
    exit();
}

// VALIDAR EMAIL
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => "Email inválido"
    ]);
    exit();
}

// GUARDAR EN BASE DE DATOS
try {
    $db = getDBConnection();

    $sql = "INSERT INTO form (full_name, company_name, email, phone, service_type, service_frequency, property_type, message)
            VALUES (:full_name, :company_name, :email, :phone, :service_type, :service_frequency, :property_type, :message)";

    $stmt = $db->prepare($sql);
    $stmt->execute([
        ':full_name' => $name,
        ':company_name' => $company,
        ':email' => $email,
        ':phone' => $phone,
        ':service_type' => $service,
        ':service_frequency' => $frequency,
        ':property_type' => $propertyType,
        ':message' => $message
    ]);

    $form_id = $db->lastInsertId();
    error_log("Formulario guardado en DB con ID: $form_id");

} catch (Exception $e) {
    // Log del error pero continuar con el envío de email
    error_log("Error al guardar en base de datos: " . $e->getMessage());
    // No detenemos el proceso, el email se debe enviar igual
}

// CUERPO DEL CORREO
$body = "Nuevo mensaje desde el formulario de contacto

=====================================
INFORMACIÓN DEL CONTACTO
=====================================

Nombre: $name
Empresa: $company
Email: $email
Teléfono: $phone

=====================================
DETALLES DEL SERVICIO
=====================================

Servicio requerido: $service
Frecuencia: $frequency
Tipo de propiedad: $propertyType

=====================================
MENSAJE
=====================================

$message

=====================================
Este mensaje fue enviado desde el formulario de contacto de primefacilityservicesgroup.com
";

// CREAR INSTANCIA DE SMTP MAILER
$mailer = new SMTPMailer(
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USERNAME,
    SMTP_PASSWORD,
    SMTP_FROM_EMAIL,
    SMTP_FROM_NAME
);

// ENVIAR EMAIL usando SMTP de Brevo
$mail_sent = $mailer->sendMail($to, $subject, $body, $email);

if ($mail_sent) {
    // Registrar éxito
    error_log("Email enviado exitosamente a: $to desde: $email usando Brevo SMTP");
    echo json_encode([
        "status" => "success",
        "message" => "Correo enviado exitosamente"
    ]);
} else {
    // Registrar error
    error_log("Error al enviar email usando Brevo SMTP");
    error_log("Datos del formulario: " . print_r($data, true));

    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Error al enviar el correo. Por favor intenta más tarde."
    ]);
}
?>
