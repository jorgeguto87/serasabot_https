@echo off
echo Iniciando o chatbot com PM2...
pm2 start index.js --name zapbot

echo.
echo Aplicando token do ngrok (caso ainda não tenha sido aplicado)...
ngrok config add-authtoken 2vjEpKyfP0oW0HV4B7aqHnwG050_22NcP2hG9sYbZdzgqR5Xe

echo.
echo Iniciando ngrok na porta 8080...
start "" ngrok http 8080

echo.
echo Tudo iniciado! Acesse o link do ngrok no terminal acima ou aguarde o navegador abrir automaticamente.
pause
