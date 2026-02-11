@echo off
chcp 65001 >nul
title 赛尔号服务器

echo ========================================
echo   赛尔号服务器
echo ========================================
echo.

:: 检查配置文件
if not exist "config\server.json" (
    echo [提示] 配置文件不存在，正在创建默认配置...
    if exist "config\server.json.default" (
        copy "config\server.json.default" "config\server.json" >nul
        echo [成功] 已创建配置文件: config\server.json
    ) else (
        echo [警告] 未找到默认配置文件
    )
)

:: 创建必要目录
if not exist "data" mkdir data >nul 2>&1
if not exist "logs" mkdir logs >nul 2>&1

echo.
echo [启动] 正在启动服务器...
echo [提示] 首次运行会自动初始化数据库
echo.

:: 启动服务器
kose_server.exe

pause
