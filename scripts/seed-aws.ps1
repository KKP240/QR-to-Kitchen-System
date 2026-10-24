# Invokes the SeedFunction Lambda of stack "qr-kitchen" (us-east-1) and prints the result.
# Seed runs inside Lambda (LabRole) because the Lab user (voclabs) cannot write to DynamoDB.
# Safe to run more than once: existing menu items and tables are not overwritten.

$region = "us-east-1"
$stack = "qr-kitchen"

$fn = aws cloudformation describe-stack-resource --stack-name $stack --logical-resource-id SeedFunction --query StackResourceDetail.PhysicalResourceId --output text --region $region
if ($LASTEXITCODE -ne 0 -or -not $fn -or $fn -eq "None") {
  Write-Host "SeedFunction not found. Start the Lab, run pnpm aws:creds, then pnpm run deploy." -ForegroundColor Red
  exit 1
}

$out = Join-Path $env:TEMP "qrk-seed-result.json"
$raw = aws lambda invoke --function-name $fn --region $region --cli-binary-format raw-in-base64-out --payload "{}" $out | Out-String
if ($LASTEXITCODE -ne 0) {
  Write-Host "Invoke failed. Check credentials with: pnpm aws:whoami" -ForegroundColor Red
  exit 1
}

$meta = $raw | ConvertFrom-Json
if ($meta.FunctionError) {
  Write-Host "SeedFunction returned an error:" -ForegroundColor Red
  Get-Content $out -Raw
  Remove-Item $out -Force -ErrorAction SilentlyContinue
  exit 1
}

Write-Host "Seed result:" -ForegroundColor Green
Get-Content $out -Raw
Remove-Item $out -Force -ErrorAction SilentlyContinue