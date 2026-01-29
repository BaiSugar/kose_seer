@echo off
chcp 65001 >nul
title KOSE Server - ProxyServer (调试模式)

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

echo ========================================
echo   重要提示
echo ========================================
echo.
echo ProxyServer 和 GameServer 不能同时运行！
echo 两者都监听 9999 端口。
echo.
echo 如果 GameServer 正在运行，请先停止它。
echo.
pause

echo [启动] ProxyServer 代理服务...
echo 客户端连接端口: 9999
echo Web 调试界面: http://localhost:9000
echo.
echo 功能: 协议抓包、数据包分析
echo.

proxy-server.exe

pause
