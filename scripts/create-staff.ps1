param(
  [Parameter(Mandatory = $true, Position = 0)]
  [ValidatePattern('^[a-zA-Z0-9._-]{3,64}$')]
  [string]$Username,

  [Parameter(Mandatory = $true, Position = 1)]
  [ValidateSet('manager', 'kitchen')]
  [string]$Role
)

$ErrorActionPreference = 'Stop'
$region = 'us-east-1'
$payloadPath = $null
$resultPath = $null
$securePassword = $null
$password = $null
$passwordPointer = [IntPtr]::Zero

try {
  $accountId = & aws sts get-caller-identity --query Account --output text --region $region
  if ($LASTEXITCODE -ne 0 -or -not $accountId) {
    throw 'AWS credentials are unavailable. Start the Lab and run pnpm aws:creds first.'
  }

  $functionName = & aws lambda list-functions --query "Functions[?contains(FunctionName, 'CreateAdminFunction')].FunctionName | [0]" --output text --region $region
  if ($LASTEXITCODE -ne 0 -or -not $functionName -or $functionName -eq 'None') {
    throw 'CreateAdminFunction was not found. Deploy the backend with pnpm run deploy first.'
  }

  $securePassword = Read-Host "Password for $Username ($Role, at least 8 characters)" -AsSecureString
  $passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
  $password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
  if ($password.Length -lt 8) {
    throw 'Password must contain at least 8 characters.'
  }

  $tempName = [Guid]::NewGuid().ToString('N')
  $payloadPath = Join-Path $env:TEMP "qrk-staff-$tempName.json"
  $resultPath = Join-Path $env:TEMP "qrk-staff-result-$tempName.json"
  $payload = @{ username = $Username; password = $password; role = $Role } | ConvertTo-Json -Compress
  [IO.File]::WriteAllText($payloadPath, $payload, (New-Object Text.UTF8Encoding($false)))

  $invokeResult = & aws lambda invoke --function-name $functionName --region $region --cli-binary-format raw-in-base64-out --payload "fileb://$payloadPath" $resultPath | ConvertFrom-Json
  if ($LASTEXITCODE -ne 0) {
    throw 'AWS Lambda invoke failed.'
  }
  if ($invokeResult.FunctionError) {
    throw "CreateAdminFunction returned $($invokeResult.FunctionError). Check the Lambda log in CloudWatch."
  }

  $response = Get-Content -LiteralPath $resultPath -Raw | ConvertFrom-Json
  if ($response.statusCode -ne 200) {
    throw "Account creation failed: $($response.body)"
  }

  Write-Host "Created/updated '$Username' with role '$Role' in AWS account $accountId." -ForegroundColor Green
  Write-Host 'The password was not written to the repository.'
}
catch {
  Write-Error $_
  exit 1
}
finally {
  if ($passwordPointer -ne [IntPtr]::Zero) {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
  }
  if ($securePassword) {
    $securePassword.Dispose()
  }
  $password = $null
  if ($payloadPath) { Remove-Item -LiteralPath $payloadPath -Force -ErrorAction SilentlyContinue }
  if ($resultPath) { Remove-Item -LiteralPath $resultPath -Force -ErrorAction SilentlyContinue }
}
