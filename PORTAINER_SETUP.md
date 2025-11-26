# Configuración Paso a Paso en Portainer

## Solución al Error: "env file not found"

Si ves el error `env file /data/compose/32/.env not found`, es porque Portainer no puede acceder a archivos `.env` cuando despliegas desde un repositorio Git.

## Solución: Configurar Variables en Portainer

### Paso 1: Crear el Stack

1. En Portainer, ve a **"Stacks"** → **"Add stack"**
2. **Name**: `scraping-tiendas-nexo`
3. **Build method**: Seleccionar **"Repository"**
4. **Repository URL**: Tu URL de Git (ej: `https://github.com/tu-usuario/scraping_tiendas_nexo.git`)
5. **Repository reference**: `refs/heads/main`
6. **Compose path**: `docker-compose.yml`

### Paso 2: Configurar Variables de Entorno

En la sección **"Environment variables"**, agrega cada variable una por una:

| Variable | Valor | Ejemplo |
|----------|-------|---------|
| `USER` | Tu email de login | `usuario@ejemplo.com` |
| `PASS` | Tu contraseña | `mi_contraseña_segura` |
| `HEADLESS` | `true` (siempre true en producción) | `true` |
| `SMTP_HOST` | Servidor SMTP | `smtp.gmail.com` |
| `SMTP_PORT` | Puerto SMTP | `587` |
| `SMTP_USER` | Usuario SMTP | `tu_email@gmail.com` |
| `SMTP_PASS` | Contraseña SMTP | `tu_contraseña_app` |
| `SMTP_FROM` | Email remitente | `tu_email@gmail.com` |
| `EMAIL_RECIPIENTS` | Destinatarios (separados por comas) | `dest1@ejemplo.com,dest2@ejemplo.com` |

**Cómo agregar cada variable:**
1. Click en "+ Add an environment variable"
2. En "name" escribir el nombre (ej: `USER`)
3. En el campo de valor escribir el valor (ej: `usuario@ejemplo.com`)
4. Repetir para cada variable

### Paso 3: Opción Alternativa - Usar stack.env

Si prefieres usar un archivo, puedes crear `stack.env` en tu repositorio Git:

1. Crear archivo `stack.env` en la raíz del proyecto:
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

2. Hacer commit y push al repositorio

3. En Portainer, en la sección "Environment variables", click en **"Load variables from .env file"** y seleccionar `stack.env`

### Paso 4: Desplegar

1. Click en **"Deploy the stack"**
2. Esperar a que se construya la imagen y se inicie el contenedor
3. Verificar en "Containers" que el contenedor esté corriendo

## Verificar que Funciona

1. Ir a **"Containers"**
2. Click en `scraping-tiendas-nexo`
3. Click en **"Logs"** para ver los logs
4. Deberías ver el proceso completo ejecutándose

## Configurar Ejecución Automática

El contenedor se ejecutará una vez y terminará. Para ejecutarlo periódicamente:

### Opción A: Cron en el Host

```bash
# Conectarse al VPS por SSH
ssh usuario@tu_vps_ip

# Editar crontab
crontab -e

# Agregar (ejecutar cada hora)
0 * * * * docker start scraping-tiendas-nexo

# O ejecutar el comando directamente cada hora
0 * * * * cd /data/compose/32 && docker-compose run --rm scraping-tiendas node main.js
```

### Opción B: Desde Portainer

1. Ir a **"Containers"**
2. Click en `scraping-tiendas-nexo`
3. Click en **"Duplicate/Edit"**
4. En **"Restart policy"**, cambiar a `Always` (aunque esto no es ideal para scripts que se ejecutan una vez)
5. Mejor usar cron como en la Opción A

## Actualizar Variables de Entorno

1. Ir a **"Stacks"**
2. Click en `scraping-tiendas-nexo`
3. Click en **"Editor"**
4. Modificar las variables en la sección "Environment variables"
5. Click en **"Update the stack"**

## Solución de Problemas

### Error: "env file not found"
✅ **Solución**: Configurar variables directamente en Portainer (ver Paso 2)

### Error: "Cannot find module"
✅ **Solución**: Verificar que el Dockerfile esté correcto y que todas las dependencias estén en package.json

### El contenedor se detiene inmediatamente
✅ **Solución**: 
- Ver logs: `docker logs scraping-tiendas-nexo`
- Verificar que todas las variables estén configuradas
- Verificar que las credenciales sean correctas

### Error de permisos en logs
✅ **Solución**: El directorio de logs se crea automáticamente, pero si hay problemas:
```bash
docker exec scraping-tiendas-nexo mkdir -p /app/logs
docker exec scraping-tiendas-nexo chmod 777 /app/logs
```

