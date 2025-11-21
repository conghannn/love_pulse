@echo off
chcp 65001 >nul

echo 🚀 启动LDR情绪表达仪表板...
echo.

REM 检查是否安装了Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 未检测到Node.js，请先安装Node.js
    echo 📥 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

REM 检查是否安装了npm
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 未检测到npm，请先安装npm
    pause
    exit /b 1
)

REM 检查是否已安装依赖
if not exist "node_modules" (
    echo 📦 安装项目依赖...
    npm install
)

REM 检查是否安装了live-server
npm list live-server >nul 2>&1
if errorlevel 1 (
    echo 📦 安装live-server...
    npm install live-server --save-dev
)

echo ✅ 依赖检查完成
echo 🌐 启动开发服务器...
echo 📱 应用将在浏览器中自动打开
echo 🔗 如果没有自动打开，请访问: http://localhost:3000
echo.
echo 💡 提示:
echo    - 按 Ctrl+C 停止服务器
echo    - 按 F1 查看应用快捷键
echo    - 支持PWA安装到桌面
echo.

REM 启动服务器
npm start

pause
