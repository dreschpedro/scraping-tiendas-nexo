/**
 * Configuración del proyecto - Carga variables de entorno
 */
import dotenv from 'dotenv';

// Cargar variables de entorno desde .env
dotenv.config();

// Credenciales de login
export const USER = process.env.USER;
export const PASS = process.env.PASS;

// URL base del sitio
export const BASE_URL = 'https://tiendas.axoft.com';

// Configuración del navegador
// Para desarrollo: false (navegador visible)
// Para producción: true (headless, sin navegador visible)
export const HEADLESS = process.env.HEADLESS === 'true' || false;

// Configuración SMTP para envío de correos
export const SMTP_HOST = process.env.SMTP_HOST;
export const SMTP_PORT = parseInt(process.env.SMTP_PORT) || 587;
export const SMTP_USER = process.env.SMTP_USER;
export const SMTP_PASS = process.env.SMTP_PASS;
export const SMTP_FROM = process.env.SMTP_FROM;

// Destinatarios del correo (separados por comas en .env)
export const EMAIL_RECIPIENTS = process.env.EMAIL_RECIPIENTS 
  ? process.env.EMAIL_RECIPIENTS.split(',').map(email => email.trim())
  : [];

// Validar que las credenciales estén configuradas
if (!USER || !PASS) {
  throw new Error(
    'Las credenciales USER y PASS deben estar configuradas en el archivo .env'
  );
}

