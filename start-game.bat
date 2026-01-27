@echo off
chcp 65001 >nul
title KOSE Server - GameServer

echo ========================================
echo   KOSE Server - 游戏服务
echo ========================================
echo.

:: 检查配置文件
if not exist "config\server.json" (
    echo [错误] 未找到配置文件: config\server.json
    pause
    exit /b 1
)

echo [启动] GameServer 游戏服务...
echo RPC端口: 50002
echo.

game-server.exe

pause
