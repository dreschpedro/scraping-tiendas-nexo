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
    const loginPhase = new LoginPhase(browserManager);
    const loginSuccess = await loginPhase.login();

    if (!loginSuccess) {
      console.error('✗ El login falló, no se puede continuar');
      await browserManager.close();
      process.exit(1);
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

    // Fase 3: Envío de correo
    console.log('\n--- FASE 3: ENVÍO DE CORREO ---');
    const emailPhase = new EmailPhase();
    
    // Preparar datos para el correo
    const datosCorreo = {
      estado: estadoFinal || 'desconocido',
      estadoFinal: estadoFinal || 'desconocido',
      fechaSincronizacion: fechaFinal || 'No disponible',
      fechaFinal: fechaFinal || 'No disponible',
      encontrado: resultado.encontrado || resultadoElementos.encontrado
    };

    const correoEnviado = await emailPhase.enviarCorreo(datosCorreo);
    
    if (correoEnviado) {
      console.log('✓ Correo enviado exitosamente');
    } else {
      console.log('⚠ No se pudo enviar el correo (verificar configuración SMTP)');
    }

    // Cerrar conexión SMTP
    await emailPhase.cerrar();

    console.log('\n✓ Proceso completado exitosamente');
  } catch (error) {
    console.error('✗ Error durante el proceso:', error);
    process.exit(1);
  } finally {
    // Cerrar el navegador al finalizar
    await browserManager.close();
  }
})();

