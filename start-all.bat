@echo off
chcp 65001 >nul
title KOSE Server - 启动所有服务

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

echo [1/4] 启动注册服务...
start "RegistServer" regist-server.exe
timeout /t 2 /nobreak >nul

echo [2/4] 启动游戏服务...
start "GameServer" game-server.exe
timeout /t 2 /nobreak >nul

echo [3/4] 启动邮件服务...
start "EmailServer" email-server.exe
timeout /t 2 /nobreak >nul

echo [4/4] 启动网关服务...
start "Gateway" gateway-server.exe
timeout /t 2 /nobreak >nul

echo.
echo ========================================
echo   所有服务已启动！
echo ========================================
echo.
echo 服务列表:
echo   - Gateway      (端口: 9999/27777)
echo   - GameServer   (端口: 50002)
echo   - RegistServer (端口: 50001)
echo   - EmailServer  (端口: 50003)
echo.
echo 客户端连接地址:
echo   登录: localhost:9999
echo   游戏: localhost:27777
echo.
echo 按任意键关闭此窗口...
pause >nul
