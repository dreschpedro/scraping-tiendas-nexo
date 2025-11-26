#!/bin/bash

# Script de instalación rápida para VPS
# Uso: bash install.sh

set -e

echo "=== Instalación de Scraping Tiendas Nexo ==="
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar que se ejecuta como root o con sudo
if [ "$EUID" -ne 0 ]; then 
    echo -e "${YELLOW}Este script necesita permisos de administrador.${NC}"
    echo "Ejecuta: sudo bash install.sh"
    exit 1
fi

# Actualizar sistema
echo -e "${GREEN}[1/8]${NC} Actualizando sistema..."
apt update && apt upgrade -y

# Instalar Node.js si no está instalado
if ! command -v node &> /dev/null; then
    echo -e "${GREEN}[2/8]${NC} Instalando Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
else
    echo -e "${GREEN}[2/8]${NC} Node.js ya está instalado: $(node --version)"
fi

# Instalar dependencias del sistema para Puppeteer
echo -e "${GREEN}[3/8]${NC} Instalando dependencias del sistema para Puppeteer..."
apt-get install -y \
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

# Instalar PM2 globalmente
if ! command -v pm2 &> /dev/null; then
    echo -e "${GREEN}[4/8]${NC} Instalando PM2..."
    npm install -g pm2
else
    echo -e "${GREEN}[4/8]${NC} PM2 ya está instalado"
fi

# Obtener directorio de trabajo
WORK_DIR=$(pwd)
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: No se encontró package.json${NC}"
    echo "Asegúrate de ejecutar este script desde el directorio del proyecto"
    exit 1
fi

# Instalar dependencias de Node.js
echo -e "${GREEN}[5/8]${NC} Instalando dependencias de Node.js..."
npm install

# Verificar archivo .env
echo -e "${GREEN}[6/8]${NC} Verificando configuración..."
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Advertencia: No se encontró archivo .env${NC}"
    echo "Crea el archivo .env con las siguientes variables:"
    echo "  USER=tu_email@ejemplo.com"
    echo "  PASS=tu_contraseña"
    echo "  HEADLESS=true"
    echo "  SMTP_HOST=smtp.gmail.com"
    echo "  SMTP_PORT=587"
    echo "  SMTP_USER=tu_email@gmail.com"
    echo "  SMTP_PASS=tu_contraseña_app"
    echo "  SMTP_FROM=tu_email@gmail.com"
    echo "  EMAIL_RECIPIENTS=destinatario1@ejemplo.com,destinatario2@ejemplo.com"
    echo ""
    read -p "¿Deseas crear el archivo .env ahora? (s/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        nano .env
    fi
else
    echo -e "${GREEN}Archivo .env encontrado${NC}"
fi

# Crear directorio de logs
echo -e "${GREEN}[7/8]${NC} Creando directorio de logs..."
mkdir -p logs

# Configurar PM2
echo -e "${GREEN}[8/8]${NC} Configurando PM2..."
pm2 start main.js --name "scraping-tiendas" || true
pm2 save || true

echo ""
echo -e "${GREEN}=== Instalación completada ===${NC}"
echo ""
echo "Comandos útiles:"
echo "  pm2 status              - Ver estado"
echo "  pm2 logs scraping-tiendas - Ver logs"
echo "  pm2 restart scraping-tiendas - Reiniciar"
echo "  pm2 stop scraping-tiendas - Detener"
echo ""
echo "No olvides:"
echo "  1. Configurar el archivo .env con tus credenciales"
echo "  2. Verificar que HEADLESS=true para producción"
echo "  3. Configurar PM2 para iniciar al arrancar: pm2 startup"
echo ""
echo "Para más información, consulta DEPLOY.md"

