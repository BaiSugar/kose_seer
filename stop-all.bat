@echo off
chcp 65001 >nul
title KOSE Server - 停止所有服务

echo ========================================
echo   KOSE Server - 停止所有服务
echo ========================================
echo.

echo 正在停止所有服务...
echo.

taskkill /F /IM gateway-server.exe 2>nul
if %errorlevel% equ 0 (
    echo [✓] Gateway 已停止
) else (
    echo [×] Gateway 未运行
)

taskkill /F /IM game-server.exe 2>nul
if %errorlevel% equ 0 (
    echo [✓] GameServer 已停止
) else (
    echo [×] GameServer 未运行
)

taskkill /F /IM regist-server.exe 2>nul
if %errorlevel% equ 0 (
    echo [✓] RegistServer 已停止
) else (
    echo [×] RegistServer 未运行
)

taskkill /F /IM email-server.exe 2>nul
if %errorlevel% equ 0 (
    echo [✓] EmailServer 已停止
) else (
    echo [×] EmailServer 未运行
)

taskkill /F /IM proxy-server.exe 2>nul
if %errorlevel% equ 0 (
    echo [✓] ProxyServer 已停止
) else (
    echo [×] ProxyServer 未运行
)

echo.
echo ========================================
echo   操作完成
echo ========================================
echo.
pause
