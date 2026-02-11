@echo off
chcp 65001 >nul
title 赛尔号服务器 - 开发模式

echo ========================================
echo   赛尔号服务器 - 开发模式
echo ========================================
echo.

:: 检查 Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到 Node.js，请先安装 Node.js
    pause
    exit /b 1
)

:: 检查依赖
if not exist "node_modules" (
    echo [提示] 首次运行，正在安装依赖...
    call npm install
    if %errorlevel% neq 0 (
        echo [错误] 依赖安装失败
        pause
        exit /b 1
    )
)

:: 检查配置文件
if not exist "config\server.json" (
    echo [提示] 配置文件不存在，正在创建默认配置...
    if exist "config\server.json.default" (
        copy "config\server.json.default" "config\server.json"
        echo [成功] 已创建配置文件: config\server.json
    ) else (
        echo [警告] 未找到默认配置文件
    )
)

:: 创建数据目录
if not exist "data" (
    echo [提示] 创建数据目录...
    mkdir data
)

:: 创建日志目录
if not exist "logs" (
    echo [提示] 创建日志目录...
    mkdir logs
)

echo.
echo [启动] 正在启动开发服务器（自动重启）...
echo [提示] 数据库会在程序启动时自动初始化
echo [提示] 按 Ctrl+C 停止服务器
echo.

:: 启动开发模式（自动重启，数据库会在程序内部自动初始化）
npm run dev
