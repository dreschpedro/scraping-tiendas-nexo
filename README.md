# Scraping Tiendas Nexo

Servicio de scraping para tiendas.axoft.com usando Puppeteer (Node.js)

## Estructura del Proyecto

El proyecto está organizado en fases, cada una en su propio archivo:

- **browser_manager.js**: Controla el navegador y la vista (inicialización, navegación, etc.)
- **fase1_login.js**: Fase 1 - Controla los inputs, botones y lógica específica del login
- **fase2_analisis.js**: Fase 2 - Analiza el estado del servicio (activo/inactivo)
- **fase3_email.js**: Fase 3 - Envía correo electrónico con el estado del proceso
- **config.js**: Configuración y carga de variables de entorno

## Instalación

1. Clonar o descargar el proyecto

2. Instalar las dependencias:
```bash
npm install
```

**Nota**: El proyecto usa Puppeteer que descarga automáticamente Chromium. Solo necesitas tener Node.js instalado.

3. Configurar las variables de entorno:
   - Crear archivo `.env` en la raíz del proyecto
   - Editar `.env` y agregar tus credenciales:
   ```
   # Credenciales de login
   USER=tu_email@ejemplo.com
   PASS=tu_contraseña
   
   # Configuración del navegador
   HEADLESS=false  # false para desarrollo (navegador visible), true para producción
   
   # Configuración SMTP para envío de correos
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=tu_email@gmail.com
   SMTP_PASS=tu_contraseña_app
   SMTP_FROM=tu_email@gmail.com
   
   # Destinatarios del correo (separados por comas)
   EMAIL_RECIPIENTS=destinatario1@ejemplo.com,destinatario2@ejemplo.com
   ```

## Uso

### Fase 1: Login

Para probar el login con navegador visible:

```bash
npm start
```

O directamente:

```bash
node fase1_login.js
```

Para usar el login en otro script:

```javascript
import BrowserManager from './browser_manager.js';
import LoginPhase from './fase1_login.js';

// Inicializar el navegador
const browserManager = new BrowserManager(false); // false = visible, true = headless
await browserManager.init();

// Crear la fase de login
const loginPhase = new LoginPhase(browserManager);

// Intentar hacer login
if (await loginPhase.login()) {
  const page = browserManager.getPage();
  // Usar page para hacer acciones en el navegador autenticado
  // Ejemplo: await page.goto('https://tiendas.axoft.com/alguna-ruta');
}
```

## Despliegue en VPS

Para una guía completa y detallada de despliegue en VPS, consulta el archivo **[DEPLOY.md](DEPLOY.md)**.

**Resumen rápido:**

1. Conectarse al VPS: `ssh usuario@tu_vps_ip`
2. Instalar Node.js 20.x
3. Instalar dependencias del sistema para Puppeteer
4. Subir los archivos al servidor
5. Instalar dependencias: `npm install`
6. Configurar `.env` con `HEADLESS=true`
7. Configurar ejecución automática (PM2, Cron, o systemd)

Ver **[DEPLOY.md](DEPLOY.md)** para instrucciones detalladas paso a paso.

## Modo Headless (Producción)

Para ejecutar sin navegador visible en producción:

1. En el archivo `.env`, establecer:
   ```y
   HEADLESS=true
   ```

2. O en el código:
   ```javascript
   const browserManager = new BrowserManager(true); // headless
   ```

## Fases del Proceso

### Fase 1: Login
Realiza el login en la aplicación usando las credenciales configuradas.

### Fase 2: Análisis
Analiza el estado del servicio buscando indicadores de activo/inactivo en la página.

### Fase 3: Envío de Correo
Envía un correo electrónico con el estado del servicio a los destinatarios configurados.

## Arquitectura

El proyecto separa las responsabilidades:

- **BrowserManager**: Se encarga de todo lo relacionado con el navegador (inicialización, navegación, esperas, capturas)
- **LoginPhase**: Se encarga de la lógica específica del login (inputs, botones, validaciones)
- **AnalisisPhase**: Analiza el estado del servicio en la página
- **EmailPhase**: Envía correos electrónicos con el estado del proceso

Esta separación permite:
- Reutilizar BrowserManager en otras fases
- Mantener el código organizado y fácil de mantener
- Facilitar las pruebas

## Configuración SMTP

Para Gmail, necesitarás usar una "Contraseña de aplicación":
1. Ve a tu cuenta de Google
2. Activa la verificación en 2 pasos
3. Genera una contraseña de aplicación
4. Usa esa contraseña en `SMTP_PASS`

Para otros proveedores SMTP, ajusta `SMTP_HOST` y `SMTP_PORT` según corresponda.

## Notas

- Asegúrate de mantener el archivo `.env` seguro y no subirlo a repositorios públicos
- El `.env` está en `.gitignore` por defecto
- Para producción en VPS, usa `HEADLESS=true` para ahorrar recursos
- Puppeteer descarga automáticamente Chromium compatible
- El correo se envía automáticamente después del análisis con el estado del servicio

