@echo off
cd /d "%~dp0"
title Good Noura shop
echo Starting Good Noura... keep this window open while the shop is running.
start "" http://localhost:5173/admin
node server.js
pause
