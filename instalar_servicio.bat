@echo off
echo ==============================================================
echo       INSTALADOR DEL SERVICIO DE IMPRESION DE COMANDAS
echo ==============================================================
echo.

echo [1/6] Instalando PM2 (Gestor de Procesos) de forma global...
call npm install -g pm2
echo.

echo [2/6] Instalando ts-node para poder ejecutar TypeScript...
call npm install -g ts-node typescript
echo.

echo [3/6] Instalando pm2-windows-startup para arranque automatico...
call npm install -g pm2-windows-startup
echo.

echo [4/6] Registrando PM2 en el arranque de Windows...
call pm2-startup install
echo.

echo [5/6] Preparando e Iniciando el Print Worker...
cd print-worker
echo Instalando dependencias locales del worker (por si acaso)...
call npm install
echo Arrancando el proceso en PM2...
call pm2 start worker.ts --name "Motor-Impresion-Comandas" --interpreter ts-node
cd ..
echo.

echo [6/6] Congelando y guardando los procesos para futuros reinicios...
call pm2 save
echo.

echo ==============================================================
echo   ¡EXITO! El servicio "Motor-Impresion-Comandas" esta corriendo.
echo   Se iniciara de forma automatica cada vez que prendas la PC.
echo ==============================================================
echo.
pause
