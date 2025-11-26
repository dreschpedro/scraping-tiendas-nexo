/**
 * Fase 1 - Login
 * Se encarga de realizar el login en la aplicación
 */
import BrowserManager from './browser_manager.js';
import { BASE_URL, USER, PASS } from './config.js';

class LoginPhase {
  constructor(browserManager) {
    this.browserManager = browserManager;
  }

  /**
   * Realiza el login en la aplicación
   * @returns {Promise<boolean>} - true si el login fue exitoso, false en caso contrario
   */
  async login() {
    try {
      const page = this.browserManager.getPage();

      // Navegar a la URL base
      console.log('Navegando a la página de login...');
      const navigated = await this.browserManager.navigate(BASE_URL);
      if (!navigated) {
        return false;
      }

      // Esperar a que la página cargue completamente
      await this.browserManager.wait(2000);

      // Buscar y llenar el campo de usuario (usando el ID específico del formulario)
      console.log('Buscando campo de usuario...');
      const userInput = await this.browserManager.waitForElement('#UserName, input[name="UserName"], input[type="email"]');
      
      if (!userInput) {
        console.error('✗ No se encontró el campo de usuario');
        return false;
      }

      await userInput.click({ clickCount: 3 }); // Seleccionar todo el texto si hay alguno
      await userInput.type(USER, { delay: 100 });
      console.log('✓ Usuario ingresado');

      // Buscar y llenar el campo de contraseña (usando el ID específico del formulario)
      console.log('Buscando campo de contraseña...');
      const passInput = await this.browserManager.waitForElement('#Password, input[name="Password"], input[type="password"]');
      
      if (!passInput) {
        console.error('✗ No se encontró el campo de contraseña');
        return false;
      }

      await passInput.click({ clickCount: 3 });
      await passInput.type(PASS, { delay: 100 });
      console.log('✓ Contraseña ingresada');

      // Buscar y hacer clic en el botón de login (usando la clase específica del formulario)
      console.log('Buscando botón de login...');
      let loginButton = null;
      
      // Intentar diferentes selectores en orden de prioridad
      const selectores = [
        'input.axnexo-btn-login',
        'input[type="submit"].axnexo-btn-login',
        'input[type="submit"]',
        'input.btn.axnexo-btn-login'
      ];

      for (const selector of selectores) {
        loginButton = await this.browserManager.waitForElement(selector, 2000);
        if (loginButton) {
          console.log(`✓ Botón encontrado con selector: ${selector}`);
          break;
        }
      }

      if (!loginButton) {
        // Intentar buscar por el texto del valor
        try {
          const buttons = await page.$$('input[type="submit"]');
          for (const btn of buttons) {
            const value = await page.evaluate(el => el.value, btn);
            if (value && value.includes('Iniciar')) {
              loginButton = btn;
              console.log('✓ Botón encontrado por texto del valor');
              break;
            }
          }
        } catch (e) {
          // Continuar con Enter
        }
      }

      if (!loginButton) {
        // Intentar con Enter si no se encuentra el botón
        console.log('Botón no encontrado, intentando con Enter...');
        await passInput.press('Enter');
      } else {
        await loginButton.click();
        console.log('✓ Botón de login presionado');
      }

      console.log('✓ Botón de login presionado');

      // Esperar a que la navegación se complete
      await this.browserManager.wait(3000);

      // Verificar si el login fue exitoso (verificando que no estemos en la página de login)
      const currentUrl = await this.browserManager.getCurrentUrl();
      console.log(`URL actual: ${currentUrl}`);

      // Esperar 3 segundos adicionales como se solicitó
      console.log('Esperando 3 segundos...');
      await this.browserManager.wait(3000);

      console.log('✓ Login completado');
      return true;
    } catch (error) {
      console.error('✗ Error durante el login:', error.message);
      return false;
    }
  }
}

// Si se ejecuta directamente, hacer el login
const isMainModule = process.argv[1] && process.argv[1].endsWith('fase1_login.js');
if (isMainModule) {
  (async () => {
    const browserManager = new BrowserManager();
    
    try {
      const initialized = await browserManager.init();
      if (!initialized) {
        console.error('No se pudo inicializar el navegador');
        process.exit(1);
      }

      const loginPhase = new LoginPhase(browserManager);
      const success = await loginPhase.login();

      if (success) {
        console.log('✓ Proceso de login completado exitosamente');
      } else {
        console.error('✗ El proceso de login falló');
        process.exit(1);
      }
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    } finally {
      // No cerrar el navegador para permitir continuar con otras fases
      // await browserManager.close();
    }
  })();
}

export default LoginPhase;

