@echo off
chcp 65001
echo ====================================
echo    CRM销售平台 2.0 启动脚本
echo ====================================
echo.

:: 检查Python是否安装
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到Python，请先安装Python 3.8+
    pause
    exit /b 1
)

echo [信息] Python环境检查通过

:: 检查虚拟环境
if not exist "venv" (
    echo [信息] 创建虚拟环境...
    python -m venv venv
    if %errorlevel% neq 0 (
        echo [错误] 虚拟环境创建失败
        pause
        exit /b 1
    )
)

:: 激活虚拟环境
echo [信息] 激活虚拟环境...
call venv\Scripts\activate.bat

:: 安装依赖
echo [信息] 检查并安装依赖包...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [错误] 依赖包安装失败
    pause
    exit /b 1
)

:: 启动后端服务
echo.
echo [信息] 启动后端服务...
echo [提示] 后端服务将在 http://localhost:5000 启动
echo [提示] 请在浏览器中访问 http://localhost:3000 使用前端界面
echo [提示] 按 Ctrl+C 停止服务
echo.

cd backend
python app.py

echo.
echo [信息] 服务已停止
pause