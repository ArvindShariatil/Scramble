# deploy.ps1 - Windows PowerShell deployment script for Scramble Game

Write-Host "🚀 Starting Scramble Game production deployment..." -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green

# Check if we're in the correct directory
if (!(Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found. Please run this script from the scramble-game directory." -ForegroundColor Red
    exit 1
}

# Step 1: Clean previous builds
Write-Host "🧹 Cleaning previous builds..." -ForegroundColor Yellow
npm run clean

# Step 2: Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm ci

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Dependency installation failed." -ForegroundColor Red
    exit 1
}

# Step 3: Run linting
Write-Host "🔍 Running TypeScript linting..." -ForegroundColor Yellow
npm run lint

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Linting failed. Please fix TypeScript errors before deployment." -ForegroundColor Red
    exit 1
}

# Step 4: Run tests
Write-Host "🧪 Running production tests..." -ForegroundColor Yellow
npm run test:prod

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Tests failed. Please fix failing tests before deployment." -ForegroundColor Red
    exit 1
}

# Step 5: Build for production
Write-Host "🔨 Building for production..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed. Please fix build errors before deployment." -ForegroundColor Red
    exit 1
}

# Step 6: Analyze bundle size
Write-Host "📊 Analyzing bundle size..." -ForegroundColor Yellow
npm run build:size

# Step 7: Deployment options
Write-Host ""
Write-Host "✅ Build completed successfully!" -ForegroundColor Green
Write-Host "📦 Production build is ready in the 'dist' directory" -ForegroundColor Green
Write-Host ""
Write-Host "Choose deployment option:" -ForegroundColor Cyan
Write-Host "1) Deploy to Netlify" -ForegroundColor White
Write-Host "2) Deploy to Vercel" -ForegroundColor White
Write-Host "3) Deploy to GitHub Pages" -ForegroundColor White
Write-Host "4) Skip deployment (build only)" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter your choice (1-4)"

switch ($choice) {
    "1" {
        Write-Host "🌐 Deploying to Netlify..." -ForegroundColor Yellow
        if (Get-Command netlify -ErrorAction SilentlyContinue) {
            netlify deploy --prod --dir=dist
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Deployed to Netlify!" -ForegroundColor Green
                Write-Host "🎮 Game is live at: https://scramble-game.netlify.app" -ForegroundColor Green
            }
        }
        else {
            Write-Host "❌ Netlify CLI not installed. Install with: npm install -g netlify-cli" -ForegroundColor Red
        }
    }
    "2" {
        Write-Host "🌐 Deploying to Vercel..." -ForegroundColor Yellow
        if (Get-Command vercel -ErrorAction SilentlyContinue) {
            vercel --prod
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Deployed to Vercel!" -ForegroundColor Green
            }
        }
        else {
            Write-Host "❌ Vercel CLI not installed. Install with: npm install -g vercel" -ForegroundColor Red
        }
    }
    "3" {
        Write-Host "🌐 Deploying to GitHub Pages..." -ForegroundColor Yellow
        if (Get-Command gh-pages -ErrorAction SilentlyContinue) {
            npm run deploy:github
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Deployed to GitHub Pages!" -ForegroundColor Green
            }
        }
        else {
            Write-Host "❌ gh-pages not installed. Install with: npm install -g gh-pages" -ForegroundColor Red
        }
    }
    "4" {
        Write-Host "📦 Build completed. Skipping deployment." -ForegroundColor Yellow
    }
    default {
        Write-Host "❌ Invalid choice. Build completed but not deployed." -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🎉 Deployment process complete!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green