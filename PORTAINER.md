# Guía Rápida: Despliegue con Portainer

Esta es una guía rápida para desplegar el proyecto usando Portainer.

## Requisitos Previos

- Portainer instalado y funcionando
- Acceso SSH al VPS
- Archivos del proyecto subidos al servidor

## Pasos Rápidos

### 1. Preparar Archivos en el VPS

```bash
# Conectarse al VPS
ssh usuario@tu_vps_ip

# Crear directorio (si no existe)
mkdir -p ~/scraping_tiendas_nexo
cd ~/scraping_tiendas_nexo

# Subir archivos (desde tu máquina local)
# Opción A: Con Git
git clone https://tu-repositorio.git .

# Opción B: Con SCP
scp -r . usuario@tu_vps_ip:~/scraping_tiendas_nexo
```

### 2. Configurar Variables de Entorno

**IMPORTANTE**: Cuando despliegas desde un repositorio Git, Portainer no puede acceder a archivos `.env` del servidor. Debes configurar las variables directamente en Portainer.

### 3. Desplegar en Portainer

#### Método 1: Stack con Docker Compose (Recomendado)

1. **Abrir Portainer**: `http://tu_vps_ip:9000`

2. **Ir a "Stacks"** → **"Add stack"**

3. **Configurar el stack**:
   - **Name**: `scraping-tiendas-nexo`
   - **Build method**: Seleccionar **"Repository"**
   - **Repository URL**: `https://github.com/tu-usuario/scraping_tiendas_nexo.git`
   - **Repository reference**: `refs/heads/main` (o la rama que uses)
   - **Compose path**: `docker-compose.yml`

4. **Configurar Variables de Entorno** (IMPORTANTE):
   
   En la sección "Environment variables", agregar cada variable:
   
   - `USER` = `tu_email@ejemplo.com`
   - `PASS` = `tu_contraseña`
   - `HEADLESS` = `true`
   - `SMTP_HOST` = `smtp.gmail.com`
   - `SMTP_PORT` = `587`
   - `SMTP_USER` = `tu_email@gmail.com`
   - `SMTP_PASS` = `tu_contraseña_app`
   - `SMTP_FROM` = `tu_email@gmail.com`
   - `EMAIL_RECIPIENTS` = `destinatario1@ejemplo.com,destinatario2@ejemplo.com`
   
   **O usar "Load variables from .env file"** si tienes un archivo `stack.env` en el repositorio.

5. **Click en "Deploy the stack"**

6. **Verificar** en "Containers" que el contenedor esté corriendo

**Nota**: El `docker-compose.yml` ya está configurado para usar variables de entorno directamente, no necesita archivo `.env` montado.

#### Método 2: Contenedor Manual

1. **En Portainer, ir a "Images"** → **"Build a new image"**

2. **Configurar build**:
   - **Image name**: `scraping-tiendas:latest`
   - **Build method**: "Upload"
   - Subir todos los archivos del proyecto (o usar Git)

3. **Esperar a que termine el build**

4. **Crear contenedor**:
   - Ir a "Containers" → "Add container"
   - **Name**: `scraping-tiendas-nexo`
   - **Image**: `scraping-tiendas:latest`
   - **Restart policy**: `Unless stopped`
   
5. **Configurar Environment**:
   - Click en "Env"
   - Agregar cada variable del `.env` manualmente
   - O usar "Env file" y montar: `/home/usuario/scraping_tiendas_nexo/.env`

6. **Configurar Volumes**:
   - Click en "Volumes"
   - **Bind mount**:
     - `/home/usuario/scraping_tiendas_nexo/.env` → `/app/.env` (read-only)
     - `/home/usuario/scraping_tiendas_nexo/logs` → `/app/logs`

7. **Click en "Deploy the container"**

### 4. Configurar Ejecución Automática

El contenedor se ejecutará una vez y terminará. Para ejecutarlo periódicamente:

#### Opción A: Cron en el Host

```bash
# Editar crontab
crontab -e

# Agregar (ejecutar cada hora)
0 * * * * docker start scraping-tiendas-nexo

# O ejecutar el comando directamente
0 * * * * cd /home/usuario/scraping_tiendas_nexo && docker run --rm --env-file .env scraping-tiendas:latest
```

#### Opción B: Usar Watchtower o Similar

Instalar un contenedor que ejecute otros contenedores periódicamente.

### 5. Ver Logs

**En Portainer:**
- Ir a "Containers"
- Click en `scraping-tiendas-nexo`
- Click en "Logs"

**En Terminal:**
```bash
docker logs scraping-tiendas-nexo
docker logs -f scraping-tiendas-nexo  # Seguir logs
```

## Actualizar la Aplicación

1. **Subir nuevos archivos al VPS**
2. **En Portainer**:
   - Si usas Stack: Ir a "Stacks" → Click en el stack → "Editor" → "Update"
   - Si usas contenedor manual: Reconstruir imagen y recrear contenedor

3. **O desde terminal**:
```bash
cd ~/scraping_tiendas_nexo
docker-compose build
docker-compose up -d
```

## Solución de Problemas

### El contenedor se detiene inmediatamente

- Verificar logs: `docker logs scraping-tiendas-nexo`
- Verificar que el `.env` esté correcto
- Verificar que todas las variables estén configuradas

### Error de permisos

```bash
# Dar permisos al directorio de logs
chmod -R 777 ~/scraping_tiendas_nexo/logs
```

### Error de memoria

- Aumentar límites de memoria en Portainer
- O reducir recursos en `docker-compose.yml`

### El correo no se envía

- Verificar configuración SMTP en `.env`
- Verificar logs del contenedor
- Probar credenciales SMTP manualmente

## Comandos Útiles

```bash
# Ver estado
docker ps -a | grep scraping

# Reiniciar
docker restart scraping-tiendas-nexo

# Detener
docker stop scraping-tiendas-nexo

# Eliminar
docker rm scraping-tiendas-nexo

# Ver uso de recursos
docker stats scraping-tiendas-nexo
```

