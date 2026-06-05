# 🚀 Quick Start Testing Script

# This script helps you test the MedCare frontend quickly
# Run this in your terminal to setup test environment

echo "🚀 Setting up MedCare Frontend for Testing..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create test environment file
echo "⚙️ Creating test environment..."
cat > .env.test << EOL
VITE_API_BASE_URL=http://localhost:8080
VITE_APP_NAME=MedCare Test
EOL

# Build the project to check for errors
echo "🔨 Building project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "🎯 Next steps:"
    echo "1. Start backend server at http://localhost:8080"
    echo "2. Run: npm run dev"
    echo "3. Open http://localhost:5173"
    echo "4. Test with accounts:"
    echo "   Admin: admin@medcare.vn / admin123"
    echo "   Doctor: doctor@medcare.vn / doctor123"
    echo "   Patient: patient@medcare.vn / patient123"
    echo ""
    echo "📖 See README.md for project setup instructions"
else
    echo "❌ Build failed! Check errors above."
    exit 1
fi
