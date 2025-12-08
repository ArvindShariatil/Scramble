#!/bin/bash
# deploy.sh - Production deployment script for Scramble Game

echo "🚀 Starting Scramble Game production deployment..."
echo "=================================================="

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the scramble-game directory."
    exit 1
fi

# Step 1: Clean previous builds
echo "🧹 Cleaning previous builds..."
npm run clean

# Step 2: Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Step 3: Run linting
echo "🔍 Running TypeScript linting..."
if ! npm run lint; then
    echo "❌ Linting failed. Please fix TypeScript errors before deployment."
    exit 1
fi

# Step 4: Run tests
echo "🧪 Running production tests..."
if ! npm run test:prod; then
    echo "❌ Tests failed. Please fix failing tests before deployment."
    exit 1
fi

# Step 5: Build for production
echo "🔨 Building for production..."
if ! npm run build; then
    echo "❌ Build failed. Please fix build errors before deployment."
    exit 1
fi

# Step 6: Analyze bundle size
echo "📊 Analyzing bundle size..."
npm run build:size

# Step 7: Deployment options
echo ""
echo "✅ Build completed successfully!"
echo "📦 Production build is ready in the 'dist' directory"
echo ""
echo "Choose deployment option:"
echo "1) Deploy to Netlify"
echo "2) Deploy to Vercel"
echo "3) Deploy to GitHub Pages"
echo "4) Skip deployment (build only)"
echo ""

read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo "🌐 Deploying to Netlify..."
        if command -v netlify &> /dev/null; then
            netlify deploy --prod --dir=dist
            echo "✅ Deployed to Netlify!"
            echo "🎮 Game is live at: https://scramble-game.netlify.app"
        else
            echo "❌ Netlify CLI not installed. Install with: npm install -g netlify-cli"
        fi
        ;;
    2)
        echo "🌐 Deploying to Vercel..."
        if command -v vercel &> /dev/null; then
            vercel --prod
            echo "✅ Deployed to Vercel!"
        else
            echo "❌ Vercel CLI not installed. Install with: npm install -g vercel"
        fi
        ;;
    3)
        echo "🌐 Deploying to GitHub Pages..."
        if command -v gh-pages &> /dev/null; then
            npm run deploy:github
            echo "✅ Deployed to GitHub Pages!"
        else
            echo "❌ gh-pages not installed. Install with: npm install -g gh-pages"
        fi
        ;;
    4)
        echo "📦 Build completed. Skipping deployment."
        ;;
    *)
        echo "❌ Invalid choice. Build completed but not deployed."
        ;;
esac

echo ""
echo "🎉 Deployment process complete!"
echo "=================================================="