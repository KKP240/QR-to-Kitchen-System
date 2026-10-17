@echo off
cd /d "%~dp0..\infra"
set PATH=%CD%\..\node_modules\.bin;%CD%\..\apps\api\node_modules\.bin;%PATH%
call sam build
if errorlevel 1 exit /b 1
call sam deploy