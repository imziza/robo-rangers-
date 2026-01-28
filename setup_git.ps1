$logFile = "git_setup_log.txt"
Start-Transcript -Path $logFile -Append

Write-Host "Initializing git..."
git init

Write-Host "Adding files..."
git add .

Write-Host "Committing..."
git commit -m "Initial commit to backup workspace"

Write-Host "Renaming branch to main..."
git branch -M main

Write-Host "Adding remote..."
git remote remove origin 2>$null
git remote add origin https://github.com/imziza/robo-rangers-.git

Write-Host "Pushing..."
git push -u origin main

Stop-Transcript
