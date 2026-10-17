# Reads the credentials block copied from AWS Academy (AWS Details -> AWS CLI: Show)
# from the clipboard and writes it to ~/.aws/credentials

$text = Get-Clipboard -Raw

if (-not $text -or $text -notmatch "aws_access_key_id" -or $text -notmatch "aws_session_token") {
  Write-Host "No credentials found in clipboard. Click Show next to AWS CLI, copy the whole block, then run again." -ForegroundColor Red
  exit 1
}

$text = $text.Trim()
if ($text -notmatch "^\[default\]") { $text = "[default]`n" + $text }

$dir = Join-Path $env:USERPROFILE ".aws"
New-Item -ItemType Directory -Force -Path $dir | Out-Null
$utf8 = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText((Join-Path $dir "credentials"), $text + "`n", $utf8)
[System.IO.File]::WriteAllText((Join-Path $dir "config"), "[default]`nregion = us-east-1`noutput = json`n", $utf8)

Write-Host "Credentials saved to $dir" -ForegroundColor Green