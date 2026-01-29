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

:: 检查数据目录
if not exist "data" (
    echo [提示] 创建数据目录: data\
    mkdir data
)

:: 检查日志目录
if not exist "logs" (
    echo [提示] 创建日志目录: logs\
    mkdir logs
)

echo [启动] GameServer 游戏服务...
echo 监听端口: 9999
echo 包含功能: 登录、注册、游戏逻辑
echo.

game-server.exe

pause
