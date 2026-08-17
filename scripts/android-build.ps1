# 一键构建 Android APK 并启动下载服务器
$ErrorActionPreference = "Stop"

$jdkHome = "$env:LOCALAPPDATA\Programs\jdk-21"
$gradleHome = "$env:USERPROFILE\.gradle\wrapper\dists\gradle-8.14.3-all\extracted\gradle-8.14.3"
$env:JAVA_HOME = $jdkHome
$env:HTTP_PROXY = ''
$env:HTTPS_PROXY = ''

Write-Host "=== 1. 构建前端 ===" -ForegroundColor Cyan
npm run build

Write-Host "`n=== 2. 同步到 Android ===" -ForegroundColor Cyan
npx cap sync android

Write-Host "`n=== 3. 构建 APK ===" -ForegroundColor Cyan
Push-Location android
& "$gradleHome\bin\gradle.bat" assembleDebug --no-daemon
Pop-Location

$apkPath = "android\app\build\outputs\apk\debug\app-debug.apk"
Write-Host "`n=== APK 构建完成 ===" -ForegroundColor Green
Write-Host "文件: $apkPath"

# 启动下载服务器
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -match "^192\.168\." } | Select-Object -First 1).IPAddress
Write-Host "`n=== 手机下载地址 ===" -ForegroundColor Cyan
Write-Host "http://${ip}:8888/app-debug.apk" -ForegroundColor Yellow
Write-Host "`n按 Ctrl+C 停止服务器"
python -m http.server 8888 --directory "android\app\build\outputs\apk\debug"