/**
 * Fase 3 - Envío de Correo
 * Envía un correo electrónico con el estado del proceso
 */
import nodemailer from 'nodemailer';
import { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, EMAIL_RECIPIENTS } from './config.js';

class EmailPhase {
  constructor() {
    this.transporter = null;
  }

  /**
   * Inicializa el transportador de correo
   * @returns {Promise<boolean>} - true si se inicializó correctamente
   */
  async inicializar() {
    try {
      if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
        console.error('✗ Configuración SMTP incompleta en .env');
        return false;
      }

      this.transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465, // true para 465, false para otros puertos
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
      });

      // Verificar la conexión
      await this.transporter.verify();
      console.log('✓ Configuración SMTP verificada correctamente');
      return true;
    } catch (error) {
      console.error('✗ Error al inicializar SMTP:', error.message);
      return false;
    }
  }

  /**
   * Genera el contenido HTML del correo
   * @param {Object} resultado - Resultado del análisis
   * @returns {string} - HTML del correo
   */
  generarHTMLCorreo(resultado) {
    const estado = resultado.estado || resultado.estadoFinal || 'desconocido';
    const fecha = resultado.fechaSincronizacion || resultado.fechaFinal || 'No disponible';
    const fechaActual = new Date().toLocaleString('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const esActivo = estado.toLowerCase() === 'activo';
    const colorEstado = esActivo ? '#28a745' : '#dc3545';
    const iconoEstado = esActivo ? '✓' : '✗';
    const textoEstado = esActivo ? 'ACTIVO' : 'INACTIVO';

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        .estado {
            background-color: ${colorEstado};
            color: white;
            padding: 15px;
            border-radius: 5px;
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            margin: 20px 0;
        }
        .info {
            background-color: #e9ecef;
            padding: 15px;
            border-radius: 5px;
            margin: 10px 0;
        }
        .info-item {
            margin: 10px 0;
        }
        .info-label {
            font-weight: bold;
            color: #495057;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            font-size: 12px;
            color: #6c757d;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Reporte de Estado - Tango Tiendas</h1>
    </div>
    
    <div class="estado">
        ${iconoEstado} ${textoEstado}
    </div>
    
    <div class="info">
        <div class="info-item">
            <span class="info-label">Estado del servicio:</span> ${textoEstado}
        </div>
        <div class="info-item">
            <span class="info-label">Última sincronización:</span> ${fecha}
        </div>
        <div class="info-item">
            <span class="info-label">Fecha del reporte:</span> ${fechaActual}
        </div>
    </div>
    
    <div class="footer">
        <p>Este es un correo automático generado por el sistema de monitoreo.</p>
        <p>Por favor, no responda a este correo.</p>
    </div>
</body>
</html>
    `.trim();
  }

  /**
   * Genera el texto plano del correo
   * @param {Object} resultado - Resultado del análisis
   * @returns {string} - Texto plano del correo
   */
  generarTextoCorreo(resultado) {
    const estado = resultado.estado || resultado.estadoFinal || 'desconocido';
    const fecha = resultado.fechaSincronizacion || resultado.fechaFinal || 'No disponible';
    const fechaActual = new Date().toLocaleString('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const textoEstado = estado.toUpperCase();

    return `
REPORTE DE ESTADO - TANGO TIENDAS

Estado del servicio: ${textoEstado}
Última sincronización: ${fecha}
Fecha del reporte: ${fechaActual}

---
Este es un correo automático generado por el sistema de monitoreo.
Por favor, no responda a este correo.
    `.trim();
  }

  /**
   * Envía el correo con el estado del proceso
   * @param {Object} resultado - Resultado del análisis de la fase 2
   * @returns {Promise<boolean>} - true si se envió correctamente
   */
  async enviarCorreo(resultado) {
    try {
      if (!this.transporter) {
        const inicializado = await this.inicializar();
        if (!inicializado) {
          return false;
        }
      }

      if (!EMAIL_RECIPIENTS || EMAIL_RECIPIENTS.length === 0) {
        console.error('✗ No hay destinatarios configurados en EMAIL_RECIPIENTS');
        return false;
      }

      const estado = resultado.estado || resultado.estadoFinal || 'desconocido';
      const fecha = resultado.fechaSincronizacion || resultado.fechaFinal || 'No disponible';
      
      // Asunto del correo - diferente según el estado
      const asunto = estado.toLowerCase() === 'inactivo' 
        ? `🚨 [ALERTA] Tango Tiendas - Servicio INACTIVO`
        : estado.toLowerCase() === 'activo'
        ? `✓ [Tango Tiendas] Servicio ACTIVO`
        : `[Tango Tiendas] Estado del Servicio: ${estado.toUpperCase()}`;

      const mailOptions = {
        from: SMTP_FROM,
        to: EMAIL_RECIPIENTS.join(', '),
        subject: asunto,
        text: this.generarTextoCorreo(resultado),
        html: this.generarHTMLCorreo(resultado),
      };

      console.log(`Enviando correo a ${EMAIL_RECIPIENTS.length} destinatario(s)...`);
      const info = await this.transporter.sendMail(mailOptions);
      
      console.log('✓ Correo enviado correctamente');
      console.log(`  ID del mensaje: ${info.messageId}`);
      console.log(`  Destinatarios: ${EMAIL_RECIPIENTS.join(', ')}`);
      
      return true;
    } catch (error) {
      console.error('✗ Error al enviar el correo:', error.message);
      return false;
    }
  }

  /**
   * Cierra la conexión SMTP
   */
  async cerrar() {
    if (this.transporter) {
      this.transporter.close();
      this.transporter = null;
    }
  }
}

// Si se ejecuta directamente, hacer una prueba
const isMainModule = process.argv[1] && process.argv[1].endsWith('fase3_email.js');
if (isMainModule) {
  (async () => {
    const emailPhase = new EmailPhase();
    
    try {
      const inicializado = await emailPhase.inicializar();
      if (!inicializado) {
        console.error('No se pudo inicializar el servicio de correo');
        process.exit(1);
      }

      // Datos de prueba
      const resultadoPrueba = {
        estado: 'activo',
        fechaSincronizacion: new Date().toLocaleString('es-AR')
      };

      const enviado = await emailPhase.enviarCorreo(resultadoPrueba);
      
      if (enviado) {
        console.log('✓ Correo de prueba enviado exitosamente');
      } else {
        console.error('✗ No se pudo enviar el correo de prueba');
        process.exit(1);
      }
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    } finally {
      await emailPhase.cerrar();
    }
  })();
}

export default EmailPhase;

