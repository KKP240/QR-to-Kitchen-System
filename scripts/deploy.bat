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

call sam build
if errorlevel 1 exit /b 1
call sam deploy --role-arn arn:aws:iam::%ACCOUNT_ID%:role/LabRole