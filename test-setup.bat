@echo off
echo 🚀 Setting up MedCare Frontend for Testing...
echo.

echo 📦 Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ⚙️ Creating test environment...
echo VITE_API_BASE_URL=http://localhost:8080> .env.test
echo VITE_APP_NAME=MedCare Test>> .env.test

echo 🔨 Building project...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Build failed! Check errors above.
    pause
    exit /b 1
)

echo ✅ Build successful!
echo.
echo 🎯 Next steps:
echo 1. Start backend server at http://localhost:8080
echo 2. Run: npm run dev
echo 3. Open http://localhost:5173
echo 4. Test with accounts:
echo    Admin: admin@medcare.vn / admin123
echo    Doctor: doctor@medcare.vn / doctor123
echo    Patient: patient@medcare.vn / patient123
echo.
echo 📖 See TESTING.md for detailed test instructions
echo.
pause