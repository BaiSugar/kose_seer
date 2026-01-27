@echo off
chcp 65001 >nul
title KOSE Server - RegistServer

echo ========================================
echo   KOSE Server - 注册服务
echo ========================================
echo.

:: 检查配置文件
if not exist "config\server.json" (
    echo [错误] 未找到配置文件: config\server.json
    pause
    exit /b 1
)

echo [启动] RegistServer 注册服务...
echo RPC端口: 50001
echo.

regist-server.exe

pause
