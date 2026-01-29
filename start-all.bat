@echo off
chcp 65001 >nul
title KOSE Server - 启动游戏服务

echo ========================================
echo   KOSE Server - 赛尔号怀旧服服务端
echo ========================================
echo.

:: 检查必要文件
if not exist "config\server.json" (
    echo [错误] 未找到配置文件: config\server.json
    echo 请先复制 config\server.json.default 为 config\server.json
    pause
    exit /b 1
)

if not exist "data" (
    echo [提示] 创建数据目录: data\
    mkdir data
)

if not exist "logs" (
    echo [提示] 创建日志目录: logs\
    mkdir logs
)

echo [启动] 游戏服务...
start "GameServer" game-server.exe
timeout /t 2 /nobreak >nul

echo.
echo ========================================
echo   游戏服务已启动！
echo ========================================
echo.
echo 服务信息:
echo   - GameServer (端口: 9999)
echo   - 包含功能: 登录、注册、游戏逻辑
echo.
echo 客户端连接地址: localhost:9999
echo.
echo 注意: 如需调试协议，请使用 start-proxy.bat
echo       (ProxyServer 和 GameServer 不能同时运行)
echo.
echo 按任意键关闭此窗口...
pause >nul
