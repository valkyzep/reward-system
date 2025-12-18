# Authentication System Setup Script

## Step 1: Install Dependencies
Write-Host "Installing required dependencies..." -ForegroundColor Green
npm install

## Step 2: Generate Password Hashes
Write-Host "`nGenerating password hashes..." -ForegroundColor Green
Write-Host "Please copy the SQL UPDATE statements that will be displayed." -ForegroundColor Yellow
Write-Host "You'll need to run them in your Supabase SQL Editor.`n" -ForegroundColor Yellow
node supabase/setup-passwords.js

Write-Host "`n=== NEXT STEPS ===" -ForegroundColor Cyan
Write-Host "1. Go to your Supabase Dashboard (https://supabase.com)" -ForegroundColor White
Write-Host "2. Navigate to SQL Editor" -ForegroundColor White
Write-Host "3. Run the SQL file: supabase/create-users-auth.sql" -ForegroundColor White
Write-Host "4. Run the UPDATE statements that were just generated above" -ForegroundColor White
Write-Host "5. Navigate to http://localhost:3000/login to test" -ForegroundColor White
Write-Host "`nDefault credentials will be displayed above ^" -ForegroundColor Yellow
