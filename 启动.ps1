# MarTech Open Hub 启动脚本
# 双击运行或在 PowerShell 中执行：.\启动.ps1

$projectDir = $PSScriptRoot
$port = 8080

Write-Host ""
Write-Host "  MarTech Open Hub — 启动中..." -ForegroundColor Cyan
Write-Host ""

# 检查 node
try {
    $nodeVer = node --version 2>&1
    Write-Host "  Node.js: $nodeVer" -ForegroundColor Green
} catch {
    Write-Host "  [错误] 未安装 Node.js，请先安装 https://nodejs.org" -ForegroundColor Red
    Read-Host "按回车退出"
    exit 1
}

# 检查 pnpm
try {
    $pnpmVer = pnpm --version 2>&1
    Write-Host "  pnpm:   $pnpmVer" -ForegroundColor Green
} catch {
    Write-Host "  [提示] 未安装 pnpm，正在安装..." -ForegroundColor Yellow
    npm install -g pnpm
}

# 检查依赖
if (-not (Test-Path "$projectDir\node_modules")) {
    Write-Host "  [提示] 首次运行，正在安装依赖..." -ForegroundColor Yellow
    Set-Location $projectDir
    pnpm install
}

# 检查端口占用
$occupied = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
if ($occupied) {
    Write-Host "  [提示] 端口 $port 被占用，尝试释放..." -ForegroundColor Yellow
    $occupied | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object {
        Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 1
}

# 启动开发服务器
Write-Host ""
Write-Host "  正在启动开发服务器..." -ForegroundColor Cyan
Write-Host "  地址: http://localhost:$port" -ForegroundColor White
Write-Host ""

Set-Location $projectDir

# 延迟打开浏览器
Start-Job -ScriptBlock {
    Start-Sleep -Seconds 5
    Start-Process "http://localhost:$using:port"
} | Out-Null

# 启动 next dev（前台运行，Ctrl+C 可停止）
pnpm dev --port $port
