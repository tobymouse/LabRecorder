@echo off
chcp 65001 >nul
title 实验记录系统

cd /d "%~dp0"

:: 检查 node 是否存在
where node >nul 2>&1
if errorlevel 1 (
    echo [错误] 未找到 Node.js，请先安装 Node.js
    pause
    exit /b 1
)

:: 检查 3030 端口是否已被占用
netstat -ano | findstr ":3030 " | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 (
    echo [提示] 服务器已在运行，直接打开浏览器...
    start "" "http://localhost:3030"
    exit /b 0
)

:: 用 PowerShell 延迟1秒后打开浏览器（在 node 启动的同时）
start "" powershell -WindowStyle Hidden -Command "Start-Sleep 2; Start-Process 'http://localhost:3030'"

echo ========================================
echo  实验记录系统
echo  地址: http://localhost:3030
echo  关闭此窗口将停止服务器
echo ========================================
echo.

node server.js
