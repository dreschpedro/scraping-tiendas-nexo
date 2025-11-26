/**
 * Script principal - Ejecuta todas las fases en secuencia
 */
import BrowserManager from './browser_manager.js';
import LoginPhase from './fase1_login.js';
import AnalisisPhase from './fase2_analisis.js';
import EmailPhase from './fase3_email.js';

(async () => {
  const browserManager = new BrowserManager();
  
  try {
    console.log('=== Iniciando proceso de scraping ===\n');

    // Inicializar el navegador
    const initialized = await browserManager.init();
    if (!initialized) {
      console.error('✗ No se pudo inicializar el navegador');
      process.exit(1);
    }

    // Fase 1: Login
    console.log('--- FASE 1: LOGIN ---');
    
    // Verificar si está en modo simulación
    if (process.env.SIMULATE_TIMEOUT === 'true') {
      console.log('⚠⚠⚠ MODO SIMULACIÓN DE TIMEOUT ACTIVADO ⚠⚠⚠');
      console.log('  Se simulará un error de timeout para probar el envío de correo');
      console.log('  Para desactivar, quitar SIMULATE_TIMEOUT=true del .env\n');
    }
    
    const loginPhase = new LoginPhase(browserManager);
    
    try {
      const loginSuccess = await loginPhase.login();

      if (!loginSuccess) {
        console.error('✗ El login falló, no se puede continuar');
        await browserManager.close();
        process.exit(1);
      }
    } catch (error) {
      // Si hay error de timeout o conexión, enviar correo de alerta
      const esErrorTimeout = error.message.includes('timeout') || 
                            error.message.includes('Timeout') ||
                            error.message.includes('Navigation timeout') ||
                            error.message.includes('net::ERR') ||
                            error.message.includes('Protocol error') ||
                            error.name === 'TimeoutError' ||
                            error.message.includes('Simulación de timeout');
      
      if (esErrorTimeout) {
        console.error('✗ Error de conexión/timeout al intentar acceder al servicio');
        console.error(`  Error: ${error.message}`);
        console.error('  Enviando correo de alerta...');
        
        const EmailPhase = (await import('./fase3_email.js')).default;
        const emailPhase = new EmailPhase();
        
        const datosError = {
          estado: 'error_conexion',
          estadoFinal: 'error_conexion',
          fechaSincronizacion: new Date().toLocaleString('es-AR'),
          fechaFinal: new Date().toLocaleString('es-AR'),
          error: error.message,
          encontrado: false
        };
        
        const correoEnviado = await emailPhase.enviarCorreoError(datosError);
        
        if (correoEnviado) {
          console.log('✓ Correo de error enviado exitosamente');
        } else {
          console.log('⚠ No se pudo enviar el correo de error');
        }
        
        await emailPhase.cerrar();
        await browserManager.close();
        process.exit(1);
      } else {
        // Otro tipo de error, lanzarlo normalmente
        throw error;
      }
    }

    // Esperar a que la navegación después del login se complete
    console.log('Esperando a que la navegación se complete...');
    try {
      const page = browserManager.getPage();
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {
        // Si no hay navegación, simplemente continuar
        console.log('No hay navegación pendiente, continuando...');
      });
    } catch (error) {
      console.log('Esperando carga adicional...');
      await browserManager.wait(2000);
    }

    console.log('\n--- FASE 2: ANÁLISIS ---');
    // Fase 2: Análisis
    const analisisPhase = new AnalisisPhase(browserManager);
    const resultado = await analisisPhase.analizar();
    
    // También intentar con búsqueda de elementos
    console.log('\n--- Búsqueda detallada por elementos ---');
    const resultadoElementos = await analisisPhase.buscarElementos();
    
    if (resultadoElementos.encontrado) {
      console.log(`Estado: ${resultadoElementos.estado?.toUpperCase() || 'NO ENCONTRADO'}`);
      if (resultadoElementos.fechaSincronizacion) {
        console.log(`Fecha de sincronización: ${resultadoElementos.fechaSincronizacion}`);
      }
    }

    // Resumen final
    console.log('\n=== RESUMEN ===');
    let estadoFinal = null;
    let fechaFinal = null;
    
    if (resultado.encontrado || resultadoElementos.encontrado) {
      estadoFinal = resultado.estado || resultadoElementos.estado;
      fechaFinal = resultado.fechaSincronizacion || resultadoElementos.fechaSincronizacion;
      
      console.log(`Estado del servicio: ${estadoFinal?.toUpperCase() || 'DESCONOCIDO'}`);
      if (fechaFinal) {
        console.log(`Última sincronización: ${fechaFinal}`);
      }
    } else {
      console.log('⚠ No se pudo determinar el estado del servicio');
    }

    // Fase 3: Envío de correo (solo si el servicio está inactivo)
    console.log('\n--- FASE 3: ENVÍO DE CORREO ---');
    
    // Solo enviar correo si el servicio está inactivo
    const estadoParaCorreo = estadoFinal?.toLowerCase();
    
    if (estadoParaCorreo === 'inactivo') {
      console.log('⚠ Servicio INACTIVO detectado - Enviando alerta por correo...');
      
      const emailPhase = new EmailPhase();
      
      // Preparar datos para el correo
      const datosCorreo = {
        estado: estadoFinal || 'inactivo',
        estadoFinal: estadoFinal || 'inactivo',
        fechaSincronizacion: fechaFinal || 'No disponible',
        fechaFinal: fechaFinal || 'No disponible',
        encontrado: resultado.encontrado || resultadoElementos.encontrado
      };

      const correoEnviado = await emailPhase.enviarCorreo(datosCorreo);
      
      if (correoEnviado) {
        console.log('✓ Correo de alerta enviado exitosamente');
      } else {
        console.log('⚠ No se pudo enviar el correo de alerta (verificar configuración SMTP)');
      }

      // Cerrar conexión SMTP
      await emailPhase.cerrar();
    } else if (estadoParaCorreo === 'activo') {
      console.log('✓ Servicio ACTIVO - No se envía correo (solo se envía cuando está inactivo)');
    } else {
      console.log('⚠ Estado desconocido - No se envía correo');
    }

    console.log('\n✓ Proceso completado exitosamente');
  } catch (error) {
    console.error('✗ Error durante el proceso:', error);
    process.exit(1);
  } finally {
    // Cerrar el navegador al finalizar
    await browserManager.close();
  }
})();

