/**
 * Browser Manager - Controla el navegador y la vista
 * Se encarga de inicializar, configurar y gestionar Puppeteer
 */
import puppeteer from 'puppeteer';
import { HEADLESS } from './config.js';

class BrowserManager {
  constructor(headless = null) {
    this.headless = headless !== null ? headless : HEADLESS;
    this.browser = null;
    this.page = null;
  }

  /**
   * Inicializa el navegador
   */
  async init() {
    try {
      const browserOptions = {
        headless: this.headless ? 'new' : false,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-blink-features=AutomationControlled',
        ],
        defaultViewport: {
          width: 1920,
          height: 1080,
        },
      };

      if (this.headless) {
        console.log('Modo headless activado (sin navegador visible)');
      } else {
        console.log('Modo visible activado (navegador visible)');
      }

      console.log('Inicializando navegador...');
      this.browser = await puppeteer.launch(browserOptions);
      this.page = await this.browser.newPage();

      // Configurar user agent para parecer un navegador real
      await this.page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );

      // Ocultar que es un bot
      await this.page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', {
          get: () => false,
        });
      });

      console.log('✓ Navegador inicializado correctamente');
      return true;
    } catch (error) {
      console.error('✗ Error al inicializar el navegador:', error.message);
      return false;
    }
  }

  /**
   * Navega a una URL
   * @param {string} url - URL a la que navegar
   * @param {object} options - Opciones de navegación (waitUntil, timeout, etc.)
   */
  async navigate(url, options = {}) {
    if (!this.page) {
      throw new Error('El navegador no está inicializado. Llama a init() primero.');
    }

    const defaultOptions = {
      waitUntil: 'networkidle2',
      timeout: 30000,
      ...options,
    };

    try {
      console.log(`Navegando a: ${url}`);
      await this.page.goto(url, defaultOptions);
      return true;
    } catch (error) {
      console.error(`✗ Error al navegar a ${url}:`, error.message);
      return false;
    }
  }

  /**
   * Obtiene la página actual
   * @returns {Page} - Instancia de la página de Puppeteer
   */
  getPage() {
    if (!this.page) {
      throw new Error('El navegador no está inicializado. Llama a init() primero.');
    }
    return this.page;
  }

  /**
   * Obtiene la URL actual
   * @returns {string} - URL actual
   */
  async getCurrentUrl() {
    if (!this.page) {
      throw new Error('El navegador no está inicializado. Llama a init() primero.');
    }
    return this.page.url();
  }

  /**
   * Espera a que un elemento aparezca en la página
   * @param {string} selector - Selector CSS del elemento
   * @param {number} timeout - Tiempo máximo de espera en milisegundos
   * @returns {ElementHandle|null} - El elemento encontrado o null
   */
  async waitForElement(selector, timeout = 10000) {
    if (!this.page) {
      throw new Error('El navegador no está inicializado. Llama a init() primero.');
    }

    try {
      await this.page.waitForSelector(selector, { timeout, visible: true });
      return await this.page.$(selector);
    } catch (error) {
      console.error(`✗ Elemento no encontrado: ${selector}`);
      return null;
    }
  }

  /**
   * Toma una captura de pantalla
   * @param {string} filename - Nombre del archivo (opcional)
   */
  async screenshot(filename = null) {
    if (!this.page) {
      throw new Error('El navegador no está inicializado. Llama a init() primero.');
    }

    const name = filename || `screenshot_${Date.now()}.png`;
    await this.page.screenshot({ path: name, fullPage: true });
    console.log(`✓ Captura guardada: ${name}`);
  }

  /**
   * Cierra el navegador
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log('Navegador cerrado');
    }
    this.browser = null;
    this.page = null;
  }

  /**
   * Espera un tiempo determinado
   * @param {number} ms - Milisegundos a esperar
   */
  async wait(ms) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export default BrowserManager;

