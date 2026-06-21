@echo off
chcp 65001 >nul
echo.
echo ========================================
echo   MarTech Open Hub - 启动脚本
echo ========================================
echo.

:: 检查 Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js 18+
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

:: 检查 pnpm
where pnpm >nul 2>nul
if %errorlevel% neq 0 (
    echo [提示] 未检测到 pnpm，正在安装...
    npm install -g pnpm
)

:: 检查依赖
if not exist "node_modules" (
    echo [1/3] 首次运行，正在安装依赖...
    pnpm install
    echo.
)

echo [2/3] 启动开发服务器...
echo [3/3] 浏览器将自动打开 http://localhost:3000
echo.
echo 按 Ctrl+C 停止服务器
echo.

pnpm dev
