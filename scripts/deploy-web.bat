@echo off
set PYTHONUTF8=1
cd /d "%~dp0.."


set ACCOUNT_ID=
for /f "delims=" %%i in ('aws sts get-caller-identity --query Account --output text') do set ACCOUNT_ID=%%i
if "%ACCOUNT_ID%"=="" (
  echo Cannot read AWS account. Start the Lab, then run: pnpm aws:creds
  exit /b 1
)

echo [1/5] Deploying hosting stack...
call aws cloudformation deploy --template-file infra\web-hosting.yaml --stack-name qr-kitchen-web --role-arn arn:aws:iam::%ACCOUNT_ID%:role/LabRole --no-fail-on-empty-changeset --region us-east-1
if errorlevel 1 exit /b 1

set API_URL=
set BUCKET=
set DIST=
set SITE=
for /f "delims=" %%i in ('aws cloudformation describe-stacks --stack-name qr-kitchen --query "Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue" --output text --region us-east-1') do set API_URL=%%i
for /f "delims=" %%i in ('aws cloudformation describe-stacks --stack-name qr-kitchen-web --query "Stacks[0].Outputs[?OutputKey==`BucketName`].OutputValue" --output text --region us-east-1') do set BUCKET=%%i
for /f "delims=" %%i in ('aws cloudformation describe-stacks --stack-name qr-kitchen-web --query "Stacks[0].Outputs[?OutputKey==`DistributionId`].OutputValue" --output text --region us-east-1') do set DIST=%%i
for /f "delims=" %%i in ('aws cloudformation describe-stacks --stack-name qr-kitchen-web --query "Stacks[0].Outputs[?OutputKey==`SiteUrl`].OutputValue" --output text --region us-east-1') do set SITE=%%i

if "%API_URL%"=="" (echo ApiUrl not found. Run: pnpm run deploy & exit /b 1)
if "%BUCKET%"=="" (echo BucketName not found & exit /b 1)

echo [2/5] Building web with API %API_URL%
set NEXT_PUBLIC_API_URL=%API_URL%
call pnpm --filter @qr-kitchen/web build
if errorlevel 1 exit /b 1

echo [3/5] Uploading to s3://%BUCKET%
call aws s3 sync apps\web\out s3://%BUCKET% --delete --region us-east-1
if errorlevel 1 exit /b 1

echo [4/5] Invalidating CloudFront cache
call aws cloudfront create-invalidation --distribution-id %DIST% --paths "/*" >nul
if errorlevel 1 exit /b 1

echo [5/5] Done. Site: %SITE%