@echo off
chcp 65001 >nul
title KOSE Server - Gateway

echo ========================================
echo   KOSE Server - 网关服务
echo ========================================
echo.

:: 检查配置文件
if not exist "config\server.json" (
    echo [错误] 未找到配置文件: config\server.json
    pause
    exit /b 1
)

echo [启动] Gateway 网关服务...
echo 监听端口: 9999 (登录) / 27777 (游戏)
echo RPC端口: 50000
echo.

gateway-server.exe

pause
