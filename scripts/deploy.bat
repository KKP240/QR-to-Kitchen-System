@echo off
cd /d "%~dp0..\infra"
set PATH=%CD%\..\node_modules\.bin;%CD%\..\apps\api\node_modules\.bin;%PATH%

set ACCOUNT_ID=
for /f "delims=" %%i in ('aws sts get-caller-identity --query Account --output text') do set ACCOUNT_ID=%%i
if "%ACCOUNT_ID%"=="" (
  echo Cannot read AWS account. Start the Lab, then run: pnpm aws:creds
  exit /b 1
)
echo Deploying to account %ACCOUNT_ID%

set SECRET_FILE=%USERPROFILE%\.qrk-jwt-secret
if not exist "%SECRET_FILE%" powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0new-secret.ps1" > "%SECRET_FILE%"
set JWT_SECRET=
set /p JWT_SECRET=<"%SECRET_FILE%"
if "%JWT_SECRET%"=="" (
  echo Cannot read JWT secret from %SECRET_FILE%
  exit /b 1
)

call sam build
if errorlevel 1 exit /b 1
call sam deploy --role-arn arn:aws:iam::%ACCOUNT_ID%:role/LabRole --no-fail-on-empty-changeset --parameter-overrides JwtSecret=%JWT_SECRET%