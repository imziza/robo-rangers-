$logFile = "reset_push_log.txt"
Start-Transcript -Path $logFile

Write-Host "Checking for files..."
Get-ChildItem

Write-Host "Removing .git directory..."
Remove-Item -Path .git -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Initializing git..."
git init

Write-Host "Adding files..."
git add .
git status

Write-Host "Committing..."
git commit -m "Initial commit"

Write-Host "Branching..."
git branch -M main

Write-Host "Adding remote..."
git remote add origin https://github.com/imziza/robo-rangers-.git

Write-Host "Pushing..."
git push -u origin main 2>&1

Stop-Transcript
