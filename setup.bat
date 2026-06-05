@echo off
REM ALPHA LLC MINER - Setup Script for Windows
REM Automatically configures the project for local development

echo.
echo 🚀 ALPHA LLC MINER - Automatic Setup (Windows)
echo =============================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js found: %NODE_VERSION%
echo.

REM Check if npm is installed
where npm >nul 2>nul
if errorlevel 1 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo ✅ npm found: %NPM_VERSION%
echo.

REM Install dependencies
echo 📦 Installing dependencies...
call npm install
if errorlevel 1 (
    echo ❌ Installation failed
    pause
    exit /b 1
)
echo ✅ Dependencies installed successfully
echo.

REM Create .env if it doesn't exist
if not exist .env (
    echo 📝 Creating .env file from template...
    copy .env.example .env
    echo ✅ .env file created. Please edit it with your broker credentials.
) else (
    echo ℹ️  .env file already exists (skipping)
)

echo.
echo 🔨 Running build check...
call npm run build
if errorlevel 1 (
    echo ❌ Build failed
    pause
    exit /b 1
)
echo ✅ Build successful
echo.

echo ✨ Setup complete!
echo.
echo 📌 Next steps:
echo    1. Edit .env with your MetaTrader 5 credentials
echo    2. Run: npm run dev
echo    3. Open: http://localhost:3000
echo.
echo 📖 Documentation: See MT5_INTEGRATION.md for detailed API docs
echo.
pause
