/**
 * Fase 2 - Análisis de Estado
 * Analiza si encuentra el contenido de activo.html o inactivo.html en la página
 */
import BrowserManager from './browser_manager.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class AnalisisPhase {
  constructor(browserManager) {
    this.browserManager = browserManager;
    // Cargar los HTMLs de referencia
    this.activoHTML = readFileSync(join(__dirname, 'activo.html'), 'utf-8');
    this.inactivoHTML = readFileSync(join(__dirname, 'inactivo.html'), 'utf-8');
  }

  /**
   * Analiza el estado de la página
   * @returns {Promise<Object>} - Objeto con el resultado del análisis
   */
  async analizar() {
    try {
      const page = this.browserManager.getPage();

      // Esperar 3 segundos antes de comenzar el análisis
      console.log('Esperando 3 segundos antes de analizar...');
      await this.browserManager.wait(3000);

      // Esperar a que la página esté completamente cargada
      console.log('Esperando a que la página cargue completamente...');
      try {
        // Esperar a que el documento esté completamente cargado
        await page.waitForFunction(() => document.readyState === 'complete', { timeout: 10000 });
      } catch (e) {
        // Si falla, simplemente esperar un poco más
        console.log('Esperando carga adicional...');
        await this.browserManager.wait(2000);
      }
      
      // Esperar un poco más para asegurar que todo el contenido dinámico se haya cargado
      await this.browserManager.wait(1000);

      // Obtener el HTML de la página actual
      console.log('Obteniendo contenido de la página...');
      let pageContent, pageHTML;
      try {
        pageContent = await page.content();
        pageHTML = await page.evaluate(() => document.body.innerHTML);
      } catch (error) {
        // Si el contexto fue destruido, esperar y reintentar
        if (error.message.includes('Execution context was destroyed') || error.message.includes('Target closed')) {
          console.log('Contexto destruido, esperando y reintentando...');
          await this.browserManager.wait(2000);
          pageContent = await page.content();
          pageHTML = await page.evaluate(() => document.body.innerHTML);
        } else {
          throw error;
        }
      }

      // Buscar indicadores de estado activo
      const indicadoresActivo = [
        'alert-success',
        'El servicio de Tango Tiendas se encuentra activo',
        'se encuentra activo'
      ];

      // Buscar indicadores de estado inactivo
      const indicadoresInactivo = [
        'alert-danger',
        'El servicio de Tango Tiendas se encuentra inactivo',
        'se encuentra inactivo'
      ];

      let estadoEncontrado = null;
      let coincidencias = [];

      // Verificar estado activo
      for (const indicador of indicadoresActivo) {
        if (pageHTML.includes(indicador) || pageContent.includes(indicador)) {
          estadoEncontrado = 'activo';
          coincidencias.push(indicador);
          break;
        }
      }

      // Si no se encontró activo, verificar inactivo
      if (!estadoEncontrado) {
        for (const indicador of indicadoresInactivo) {
          if (pageHTML.includes(indicador) || pageContent.includes(indicador)) {
            estadoEncontrado = 'inactivo';
            coincidencias.push(indicador);
            break;
          }
        }
      }

      // Buscar la fecha de última sincronización
      let fechaSincronizacion = null;
      const fechaRegex = /(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2})/;
      const fechaMatch = pageHTML.match(fechaRegex) || pageContent.match(fechaRegex);
      if (fechaMatch) {
        fechaSincronizacion = fechaMatch[1];
      }

      // Comparación más detallada con los HTMLs de referencia
      const tieneAlertaSuccess = pageHTML.includes('alert-success') || pageContent.includes('alert-success');
      const tieneAlertaDanger = pageHTML.includes('alert-danger') || pageContent.includes('alert-danger');
      const tieneTextoActivo = pageHTML.includes('se encuentra activo') || pageContent.includes('se encuentra activo');
      const tieneTextoInactivo = pageHTML.includes('se encuentra inactivo') || pageContent.includes('se encuentra inactivo');

      const resultado = {
        estado: estadoEncontrado,
        coincidencias: coincidencias,
        fechaSincronizacion: fechaSincronizacion,
        detalles: {
          tieneAlertaSuccess: tieneAlertaSuccess,
          tieneAlertaDanger: tieneAlertaDanger,
          tieneTextoActivo: tieneTextoActivo,
          tieneTextoInactivo: tieneTextoInactivo
        },
        encontrado: estadoEncontrado !== null
      };

      // Mostrar resultados
      if (resultado.estado === 'activo') {
        console.log('✓ Estado encontrado: ACTIVO');
        console.log(`  Fecha de sincronización: ${fechaSincronizacion || 'No encontrada'}`);
      } else if (resultado.estado === 'inactivo') {
        console.log('✗ Estado encontrado: INACTIVO');
        console.log(`  Fecha de sincronización: ${fechaSincronizacion || 'No encontrada'}`);
      } else {
        console.log('⚠ No se pudo determinar el estado');
        console.log('  Detalles:', resultado.detalles);
      }

      return resultado;
    } catch (error) {
      console.error('✗ Error durante el análisis:', error.message);
      return {
        estado: null,
        coincidencias: [],
        fechaSincronizacion: null,
        detalles: {},
        encontrado: false,
        error: error.message
      };
    }
  }

  /**
   * Busca elementos específicos en la página usando selectores
   * @returns {Promise<Object>} - Resultado de la búsqueda
   */
  async buscarElementos() {
    try {
      const page = this.browserManager.getPage();

      // Esperar un momento para asegurar que la página esté lista
      await this.browserManager.wait(1000);

      // Buscar el div con alert-success o alert-danger
      const alertSuccess = await page.$('.alert-success');
      const alertDanger = await page.$('.alert-danger');
      const alertCol = await page.$('.col-md-10');

      let estado = null;
      let texto = null;
      let fecha = null;

      if (alertSuccess) {
        estado = 'activo';
        texto = await page.evaluate(el => el.textContent, alertSuccess);
      } else if (alertDanger) {
        estado = 'inactivo';
        texto = await page.evaluate(el => el.textContent, alertDanger);
      } else if (alertCol) {
        // Intentar obtener el texto del contenedor
        texto = await page.evaluate(el => el.textContent, alertCol);
        if (texto && texto.includes('activo')) {
          estado = 'activo';
        } else if (texto && texto.includes('inactivo')) {
          estado = 'inactivo';
        }
      }

      // Extraer fecha si existe
      if (texto) {
        const fechaRegex = /(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2})/;
        const fechaMatch = texto.match(fechaRegex);
        if (fechaMatch) {
          fecha = fechaMatch[1];
        }
      }

      return {
        estado: estado,
        texto: texto,
        fechaSincronizacion: fecha,
        encontrado: estado !== null
      };
    } catch (error) {
      console.error('✗ Error al buscar elementos:', error.message);
      return {
        estado: null,
        texto: null,
        fechaSincronizacion: null,
        encontrado: false,
        error: error.message
      };
    }
  }
}

// Si se ejecuta directamente, hacer el análisis
const isMainModule = process.argv[1] && process.argv[1].endsWith('fase2_analisis.js');
if (isMainModule) {
  (async () => {
    const browserManager = new BrowserManager();
    
    try {
      const initialized = await browserManager.init();
      if (!initialized) {
        console.error('No se pudo inicializar el navegador');
        process.exit(1);
      }

      // Primero hacer login
      const LoginPhase = (await import('./fase1_login.js')).default;
      const loginPhase = new LoginPhase(browserManager);
      const loginSuccess = await loginPhase.login();

      if (!loginSuccess) {
        console.error('✗ El login falló, no se puede continuar con el análisis');
        await browserManager.close();
        process.exit(1);
      }

      // Luego hacer el análisis
      const analisisPhase = new AnalisisPhase(browserManager);
      const resultado = await analisisPhase.analizar();
      
      // También intentar con búsqueda de elementos
      console.log('\n--- Búsqueda por elementos ---');
      const resultadoElementos = await analisisPhase.buscarElementos();
      
      if (resultadoElementos.encontrado) {
        console.log(`Estado: ${resultadoElementos.estado?.toUpperCase() || 'NO ENCONTRADO'}`);
        if (resultadoElementos.fechaSincronizacion) {
          console.log(`Fecha: ${resultadoElementos.fechaSincronizacion}`);
        }
      }

      console.log('\n✓ Análisis completado');
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    } finally {
      // Cerrar el navegador al finalizar
      await browserManager.close();
    }
  })();
}

export default AnalisisPhase;

