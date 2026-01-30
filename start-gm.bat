@echo off
chcp 65001 >nul
title KOSE Server - GMServer

echo ========================================
echo   KOSE Server - GM管理服务
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

echo [启动] GMServer 管理服务...
echo 监听端口: 3002
echo 管理界面: http://localhost:3002
echo.
echo [提示] 本地模式无需登录，远程模式需要游戏账号登录
echo.

gm-server.exe

pause
