# Guía de Despliegue en VPS

Esta guía te ayudará a desplegar el proyecto de scraping en un servidor VPS.

## 🐳 Despliegue con Docker/Portainer (Recomendado)

Si tienes **Portainer** instalado en tu VPS, esta es la forma más fácil de desplegar. Ve directamente a la sección [**Despliegue con Docker/Portainer**](#despliegue-con-dockerportainer-recomendado-1).

---

## Instalación Tradicional (Sin Docker)

Si prefieres instalar directamente en el servidor sin contenedores, sigue esta sección.

## Requisitos del Servidor

- **Sistema Operativo**: Ubuntu 20.04+ o Debian 11+ (recomendado)
- **RAM**: Mínimo 1GB (2GB recomendado para Puppeteer)
- **Espacio en disco**: Mínimo 5GB
- **Node.js**: Versión 18 o superior
- **Acceso SSH** al servidor

## Paso 1: Conectarse al VPS

```bash
ssh usuario@tu_vps_ip
```

## Paso 2: Actualizar el Sistema

```bash
sudo apt update
sudo apt upgrade -y
```

## Paso 3: Instalar Node.js

### Opción A: Usando NodeSource (Recomendado)

```bash
# Instalar Node.js 20.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalación
node --version
npm --version
```

### Opción B: Usando NVM (Node Version Manager)

```bash
# Instalar NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Recargar el perfil
source ~/.bashrc

# Instalar Node.js 20
nvm install 20
nvm use 20
nvm alias default 20
```

## Paso 4: Instalar Dependencias del Sistema

Puppeteer necesita algunas dependencias del sistema:

```bash
sudo apt-get install -y \
  ca-certificates \
  fonts-liberation \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libc6 \
  libcairo2 \
  libcups2 \
  libdbus-1-3 \
  libexpat1 \
  libfontconfig1 \
  libgbm1 \
  libgcc1 \
  libglib2.0-0 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libpango-1.0-0 \
  libpangocairo-1.0-0 \
  libstdc++6 \
  libx11-6 \
  libx11-xcb1 \
  libxcb1 \
  libxcomposite1 \
  libxcursor1 \
  libxdamage1 \
  libxext6 \
  libxfixes3 \
  libxi6 \
  libxrandr2 \
  libxrender1 \
  libxss1 \
  libxtst6 \
  lsb-release \
  wget \
  xdg-utils
```

## Paso 5: Crear Usuario para la Aplicación (Opcional pero Recomendado)

```bash
# Crear usuario
sudo adduser --disabled-password --gecos "" scraping

# Cambiar al usuario
sudo su - scraping
```

## Paso 6: Subir los Archivos al VPS

### Opción A: Usando Git (Recomendado)

```bash
# En el VPS
cd ~
git clone https://github.com/tu-usuario/scraping_tiendas_nexo.git
cd scraping_tiendas_nexo
```

### Opción B: Usando SCP desde tu máquina local

```bash
# Desde tu máquina local
scp -r . usuario@tu_vps_ip:/home/usuario/scraping_tiendas_nexo
```

### Opción C: Usando rsync

```bash
# Desde tu máquina local
rsync -avz --exclude 'node_modules' --exclude '.git' \
  ./ usuario@tu_vps_ip:/home/usuario/scraping_tiendas_nexo
```

## Paso 7: Instalar Dependencias del Proyecto

```bash
cd ~/scraping_tiendas_nexo
npm install
```

**Nota**: Esto descargará Chromium automáticamente (aproximadamente 300MB).

## Paso 8: Configurar Variables de Entorno

```bash
# Crear archivo .env
nano .env
```

Agregar las siguientes variables (ajustar según tu configuración):

```env
# Credenciales de login
USER=tu_email@ejemplo.com
PASS=tu_contraseña

# Configuración del navegador (IMPORTANTE: true para producción)
HEADLESS=true

# Configuración SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_contraseña_app
SMTP_FROM=tu_email@gmail.com

# Destinatarios del correo
EMAIL_RECIPIENTS=destinatario1@ejemplo.com,destinatario2@ejemplo.com
```

Guardar con `Ctrl+O`, `Enter`, y salir con `Ctrl+X`.

## Paso 9: Probar la Instalación

```bash
# Probar que todo funciona
npm start
```

Si todo funciona correctamente, verás el proceso completo ejecutándose.

## Paso 10: Configurar Ejecución Automática

Tienes varias opciones para ejecutar el script automáticamente:

### Opción A: Usando PM2 (Recomendado)

PM2 es un gestor de procesos para Node.js que mantiene la aplicación ejecutándose y permite reiniciarla automáticamente.

```bash
# Instalar PM2 globalmente
sudo npm install -g pm2

# Iniciar la aplicación con PM2
cd ~/scraping_tiendas_nexo
pm2 start main.js --name "scraping-tiendas"

# Configurar PM2 para iniciar al arrancar el servidor
pm2 startup
pm2 save

# Ver logs
pm2 logs scraping-tiendas

# Ver estado
pm2 status

# Reiniciar
pm2 restart scraping-tiendas

# Detener
pm2 stop scraping-tiendas
```

### Opción B: Usando Cron (Para ejecución periódica)

Si quieres ejecutar el script cada cierto tiempo (por ejemplo, cada hora):

```bash
# Editar crontab
crontab -e

# Agregar una línea para ejecutar cada hora
0 * * * * cd /home/usuario/scraping_tiendas_nexo && /usr/bin/node main.js >> /home/usuario/scraping_tiendas_nexo/logs/cron.log 2>&1

# O ejecutar cada 30 minutos
*/30 * * * * cd /home/usuario/scraping_tiendas_nexo && /usr/bin/node main.js >> /home/usuario/scraping_tiendas_nexo/logs/cron.log 2>&1

# O ejecutar cada día a las 9:00 AM
0 9 * * * cd /home/usuario/scraping_tiendas_nexo && /usr/bin/node main.js >> /home/usuario/scraping_tiendas_nexo/logs/cron.log 2>&1
```

Crear el directorio de logs:

```bash
mkdir -p ~/scraping_tiendas_nexo/logs
```

### Opción C: Usando systemd (Servicio del Sistema)

Crear un archivo de servicio:

```bash
sudo nano /etc/systemd/system/scraping-tiendas.service
```

Contenido del archivo:

```ini
[Unit]
Description=Scraping Tiendas Nexo Service
After=network.target

[Service]
Type=oneshot
User=scraping
WorkingDirectory=/home/scraping/scraping_tiendas_nexo
Environment="NODE_ENV=production"
ExecStart=/usr/bin/node /home/scraping/scraping_tiendas_nexo/main.js
StandardOutput=append:/home/scraping/scraping_tiendas_nexo/logs/service.log
StandardError=append:/home/scraping/scraping_tiendas_nexo/logs/service-error.log

[Install]
WantedBy=multi-user.target
```

Para ejecutar periódicamente, crear un timer:

```bash
sudo nano /etc/systemd/system/scraping-tiendas.timer
```

Contenido:

```ini
[Unit]
Description=Run Scraping Tiendas every hour
Requires=scraping-tiendas.service

[Timer]
OnCalendar=hourly
Persistent=true

[Install]
WantedBy=timers.target
```

Activar el servicio:

```bash
sudo systemctl daemon-reload
sudo systemctl enable scraping-tiendas.timer
sudo systemctl start scraping-tiendas.timer
sudo systemctl status scraping-tiendas.timer
```

## Paso 11: Configurar Logs

Crear directorio de logs y configurar rotación:

```bash
mkdir -p ~/scraping_tiendas_nexo/logs

# Instalar logrotate (si no está instalado)
sudo apt install logrotate -y

# Crear configuración de logrotate
sudo nano /etc/logrotate.d/scraping-tiendas
```

Contenido:

```
/home/usuario/scraping_tiendas_nexo/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 usuario usuario
}
```

## Paso 12: Configurar Firewall (Opcional)

Si necesitas acceso desde fuera, configurar el firewall:

```bash
# Verificar estado
sudo ufw status

# Permitir SSH (importante, hacerlo primero)
sudo ufw allow ssh

# Activar firewall
sudo ufw enable
```

## Paso 13: Monitoreo y Mantenimiento

### Ver logs en tiempo real

```bash
# Si usas PM2
pm2 logs scraping-tiendas

# Si usas cron
tail -f ~/scraping_tiendas_nexo/logs/cron.log

# Si usas systemd
sudo journalctl -u scraping-tiendas.service -f
```

### Verificar que el proceso está ejecutándose

```bash
# Ver procesos de Node.js
ps aux | grep node

# Ver uso de recursos
top
htop  # (instalar con: sudo apt install htop)
```

### Actualizar el código

```bash
cd ~/scraping_tiendas_nexo

# Si usas Git
git pull
npm install

# Si usas PM2
pm2 restart scraping-tiendas
```

## Solución de Problemas

### Error: "Cannot find module"

```bash
# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

### Error: "Chromium not found"

```bash
# Forzar descarga de Chromium
npm install puppeteer --force
```

### Error: "Permission denied"

```bash
# Dar permisos de ejecución
chmod +x main.js
```

### El navegador no se ejecuta en headless

Verificar que `HEADLESS=true` esté en el archivo `.env`.

### Problemas de memoria

Si el servidor tiene poca RAM, puedes:

1. Reducir el viewport en `browser_manager.js`
2. Cerrar el navegador inmediatamente después de usar
3. Usar un servidor con más RAM

## Seguridad

1. **No compartir el archivo `.env`**: Está en `.gitignore` por defecto
2. **Usar contraseñas seguras**: Especialmente para SMTP
3. **Limitar acceso SSH**: Usar claves SSH en lugar de contraseñas
4. **Actualizar regularmente**: `sudo apt update && sudo apt upgrade`
5. **Monitorear logs**: Revisar logs regularmente para detectar problemas

## Resumen de Comandos Útiles

```bash
# Iniciar aplicación
npm start

# Con PM2
pm2 start main.js --name "scraping-tiendas"
pm2 logs scraping-tiendas
pm2 status
pm2 restart scraping-tiendas

# Ver logs
tail -f logs/cron.log

# Actualizar código
git pull && npm install && pm2 restart scraping-tiendas
```

---

## 🐳 Despliegue con Docker/Portainer (Recomendado)

### Requisitos

- **Docker** instalado en el VPS
- **Portainer** configurado y funcionando
- **Docker Compose** (opcional pero recomendado)

### Paso 1: Preparar los Archivos

1. **Subir los archivos al VPS** (usando Git, SCP, o rsync):

```bash
# Desde tu máquina local
scp -r . usuario@tu_vps_ip:/home/usuario/scraping_tiendas_nexo
```

2. **Conectarse al VPS y verificar archivos**:

```bash
ssh usuario@tu_vps_ip
cd /home/usuario/scraping_tiendas_nexo
ls -la
```

Debes ver estos archivos:
- `Dockerfile`
- `docker-compose.yml`
- `package.json`
- `.env` (crear si no existe)

### Paso 2: Configurar el Archivo .env

```bash
nano .env
```

Agregar todas las variables necesarias:

```env
USER=tu_email@ejemplo.com
PASS=tu_contraseña
HEADLESS=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_contraseña_app
SMTP_FROM=tu_email@gmail.com
EMAIL_RECIPIENTS=destinatario1@ejemplo.com,destinatario2@ejemplo.com
```

### Paso 3: Desplegar con Portainer

#### Opción A: Usando Docker Compose (Más Fácil)

1. **Acceder a Portainer** desde tu navegador: `http://tu_vps_ip:9000`

2. **Ir a Stacks** en el menú lateral

3. **Click en "Add stack"**

4. **Configurar el stack**:
   - **Name**: `scraping-tiendas`
   - **Build method**: Seleccionar "Repository"
   - **Repository URL**: Si tienes Git, poner la URL. Si no, usar "Upload"
   - **Compose path**: `docker-compose.yml`
   - O simplemente copiar el contenido de `docker-compose.yml` en el editor

5. **Click en "Deploy the stack"**

6. **Verificar que el contenedor esté corriendo** en "Containers"

#### Opción B: Usando Dockerfile Directamente

1. **En Portainer, ir a "Images"**

2. **Click en "Build a new image"**

3. **Configurar**:
   - **Image name**: `scraping-tiendas:latest`
   - **Build method**: "Upload" o "Repository"
   - Si usas Upload, subir el `Dockerfile` y todos los archivos necesarios

4. **Click en "Build the image"**

5. **Crear un contenedor**:
   - Ir a "Containers"
   - Click en "Add container"
   - **Name**: `scraping-tiendas-nexo`
   - **Image**: `scraping-tiendas:latest`
   - **Restart policy**: `Unless stopped`
   - **Env**: Agregar todas las variables del `.env` o usar "Env file" y montar el `.env`
   - **Volumes**: 
     - Montar `.env`: `/app/.env` (read-only)
     - Montar `logs`: `/app/logs` (para persistencia)
   - **Click en "Deploy the container"**

### Paso 4: Configurar Ejecución Automática

#### Opción A: Cron en el Host (Recomendado)

Crear un cron job en el servidor que ejecute el contenedor periódicamente:

```bash
# Editar crontab
crontab -e

# Ejecutar cada hora
0 * * * * cd /home/usuario/scraping_tiendas_nexo && docker-compose run --rm scraping-tiendas node main.js >> /home/usuario/scraping_tiendas_nexo/logs/cron.log 2>&1

# O ejecutar cada 30 minutos
*/30 * * * * cd /home/usuario/scraping_tiendas_nexo && docker-compose run --rm scraping-tiendas node main.js >> /home/usuario/scraping_tiendas_nexo/logs/cron.log 2>&1
```

#### Opción B: Usar un Contenedor Cron

Crear un contenedor adicional que ejecute cron dentro de Docker. Esto requiere un `Dockerfile.cron` adicional.

### Paso 5: Ver Logs

**Desde Portainer:**
1. Ir a "Containers"
2. Click en el contenedor `scraping-tiendas-nexo`
3. Click en "Logs" para ver los logs en tiempo real

**Desde la terminal:**
```bash
# Ver logs del contenedor
docker logs scraping-tiendas-nexo

# Seguir logs en tiempo real
docker logs -f scraping-tiendas-nexo

# Ver logs del stack (si usas docker-compose)
docker-compose logs -f
```

### Paso 6: Actualizar la Aplicación

**Desde Portainer:**
1. Ir a "Stacks" (si usas docker-compose)
2. Click en "Editor"
3. Hacer cambios si es necesario
4. Click en "Update the stack"

**Desde la terminal:**
```bash
cd /home/usuario/scraping_tiendas_nexo

# Si usas Git
git pull

# Reconstruir y reiniciar
docker-compose build
docker-compose up -d

# O si construiste manualmente
docker build -t scraping-tiendas:latest .
docker stop scraping-tiendas-nexo
docker rm scraping-tiendas-nexo
docker run -d --name scraping-tiendas-nexo --restart unless-stopped \
  --env-file .env \
  -v $(pwd)/.env:/app/.env:ro \
  -v $(pwd)/logs:/app/logs \
  scraping-tiendas:latest
```

### Comandos Útiles con Docker

```bash
# Ver contenedores corriendo
docker ps

# Ver todos los contenedores
docker ps -a

# Detener contenedor
docker stop scraping-tiendas-nexo

# Iniciar contenedor
docker start scraping-tiendas-nexo

# Reiniciar contenedor
docker restart scraping-tiendas-nexo

# Eliminar contenedor
docker rm scraping-tiendas-nexo

# Ver uso de recursos
docker stats scraping-tiendas-nexo

# Ejecutar comando dentro del contenedor
docker exec -it scraping-tiendas-nexo /bin/bash

# Ver logs
docker logs scraping-tiendas-nexo
```

### Ventajas de Usar Docker/Portainer

✅ **Aislamiento**: La aplicación corre en su propio contenedor  
✅ **Fácil gestión**: Portainer proporciona una interfaz web intuitiva  
✅ **Portabilidad**: Fácil de mover entre servidores  
✅ **Limpieza**: No contamina el sistema host  
✅ **Escalabilidad**: Fácil de escalar si es necesario  
✅ **Rollback**: Fácil volver a versiones anteriores  

---

## Soporte

Si encuentras problemas, revisa:
1. Los logs del sistema
2. Los logs de la aplicación
3. Los logs del contenedor: `docker logs scraping-tiendas-nexo`
4. El estado del contenedor en Portainer
5. La configuración del `.env`
6. Los recursos del servidor (RAM, CPU)

