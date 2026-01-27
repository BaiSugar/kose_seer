@echo off
chcp 65001 >nul
title KOSE Server - ProxyServer

echo ========================================
echo   KOSE Server - 代理服务 (调试用)
echo ========================================
echo.

:: 检查配置文件
if not exist "config\server.json" (
    echo [错误] 未找到配置文件: config\server.json
    pause
    exit /b 1
)

echo [启动] ProxyServer 代理服务...
echo 监听端口: 9000
echo Web界面: http://localhost:8080
echo.
echo 注意: 代理服务用于调试和抓包分析
echo.

proxy-server.exe

pause
