@echo off
chcp 65001 >nul
title MarTech Open Hub
echo.
echo   MarTech Open Hub — 启动中...
echo.
cd /d "%~dp0"
echo   正在启动 http://localhost:8080
echo   按 Ctrl+C 停止服务
echo.
start "" "http://localhost:8080"
pnpm dev --port 8080
pause
