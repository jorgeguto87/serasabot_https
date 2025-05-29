@echo off
echo Iniciando servidores...

:: Abre o servidor do bot (index.js) na porta 8080
start "Bot WhatsApp - Porta 8080" cmd /k "node index.js"

:: Abre o servidor de protocolo (server.js) na porta 3000
start "Servidor Protocolos - Porta 3030" cmd /k "node server.js"
