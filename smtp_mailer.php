<?php
/**
 * Clase simple para enviar emails usando SMTP (Brevo)
 * No requiere dependencias externas
 */
class SMTPMailer {
    private $host;
    private $port;
    private $username;
    private $password;
    private $from_email;
    private $from_name;

    public function __construct($host, $port, $username, $password, $from_email, $from_name) {
        $this->host = $host;
        $this->port = $port;
        $this->username = $username;
        $this->password = $password;
        $this->from_email = $from_email;
        $this->from_name = $from_name;
    }

    public function sendMail($to, $subject, $body, $replyTo = null) {
        try {
            // Convertir $to a array si es string (puede venir separado por comas)
            if (is_string($to)) {
                $to = array_map('trim', explode(',', $to));
            } elseif (!is_array($to)) {
                $to = [$to];
            }

            // Validar que haya al menos un destinatario
            if (empty($to)) {
                throw new Exception("No hay destinatarios especificados");
            }

            error_log("Enviando email a: " . implode(', ', $to));

            // Conectar al servidor SMTP
            $socket = @stream_socket_client(
                "tcp://{$this->host}:{$this->port}",
                $errno,
                $errstr,
                30,
                STREAM_CLIENT_CONNECT
            );

            if (!$socket) {
                throw new Exception("No se pudo conectar al servidor SMTP: $errstr ($errno)");
            }

            // Leer respuesta inicial
            $response = fgets($socket, 515);
            error_log("SMTP Response: " . $response);

            // EHLO
            fputs($socket, "EHLO " . $this->host . "\r\n");
            $response = $this->getResponse($socket);

            // STARTTLS
            fputs($socket, "STARTTLS\r\n");
            $response = fgets($socket, 515);
            error_log("STARTTLS Response: " . $response);

            // Habilitar encriptación TLS
            stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);

            // EHLO después de TLS
            fputs($socket, "EHLO " . $this->host . "\r\n");
            $response = $this->getResponse($socket);

            // AUTH LOGIN
            fputs($socket, "AUTH LOGIN\r\n");
            fgets($socket, 515);

            fputs($socket, base64_encode($this->username) . "\r\n");
            fgets($socket, 515);

            fputs($socket, base64_encode($this->password) . "\r\n");
            $response = fgets($socket, 515);
            error_log("AUTH Response: " . $response);

            if (strpos($response, '235') === false) {
                throw new Exception("Autenticación SMTP fallida");
            }

            // MAIL FROM
            fputs($socket, "MAIL FROM: <{$this->from_email}>\r\n");
            fgets($socket, 515);

            // RCPT TO - Agregar cada destinatario
            foreach ($to as $recipient) {
                $recipient = trim($recipient);
                if (!empty($recipient)) {
                    fputs($socket, "RCPT TO: <{$recipient}>\r\n");
                    $response = fgets($socket, 515);
                    error_log("RCPT TO <{$recipient}> Response: " . $response);
                }
            }

            // DATA
            fputs($socket, "DATA\r\n");
            fgets($socket, 515);

            // Headers y cuerpo
            $headers = "From: {$this->from_name} <{$this->from_email}>\r\n";
            $headers .= "To: " . implode(', ', array_map(function($email) {
                return "<" . trim($email) . ">";
            }, $to)) . "\r\n";
            if ($replyTo) {
                $headers .= "Reply-To: <{$replyTo}>\r\n";
            }
            $headers .= "Subject: {$subject}\r\n";
            $headers .= "MIME-Version: 1.0\r\n";
            $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
            $headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";
            $headers .= "\r\n";

            fputs($socket, $headers . $body . "\r\n.\r\n");
            $response = fgets($socket, 515);
            error_log("DATA Response: " . $response);

            // QUIT
            fputs($socket, "QUIT\r\n");
            fgets($socket, 515);

            fclose($socket);

            return true;

        } catch (Exception $e) {
            error_log("Error enviando email: " . $e->getMessage());
            return false;
        }
    }

    private function getResponse($socket) {
        $response = '';
        while ($line = fgets($socket, 515)) {
            $response .= $line;
            if (substr($line, 3, 1) == ' ') {
                break;
            }
        }
        return $response;
    }
}
?>
