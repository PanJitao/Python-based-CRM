@echo off
chcp 65001
echo ====================================
echo   CRM销售平台 2.0 前端启动脚本
echo ====================================
echo.

:: 检查Python是否安装
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到Python，请先安装Python 3.8+
    echo [提示] 或者使用其他HTTP服务器启动前端
    pause
    exit /b 1
)

echo [信息] Python环境检查通过
echo [信息] 启动前端HTTP服务器...
echo [提示] 前端应用将在 http://localhost:3000 启动
echo [提示] 请确保后端服务已在 http://localhost:5000 运行
echo [提示] 按 Ctrl+C 停止服务
echo.

cd frontend
python -m http.server 3000

echo.
echo [信息] 前端服务已停止
pause