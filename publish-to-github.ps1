# PowerShell script: Publish current folder as a new GitHub repo named 'eliya'

# Remove old git repo if exists
if (Test-Path .git) { Remove-Item -Recurse -Force .git }

# Init new git repo
& "C:\Program Files\Git\cmd\git.exe" init
& "C:\Program Files\Git\cmd\git.exe" add .
& "C:\Program Files\Git\cmd\git.exe" config user.name "nadir"
& "C:\Program Files\Git\cmd\git.exe" config user.email "nadir@example.com"
& "C:\Program Files\Git\cmd\git.exe" commit -m "Initial publish: Xbox-style game portal with Pacman, Forza, Halo"
& "C:\Program Files\Git\cmd\git.exe" branch -M main

# Create/push GitHub repo
& "C:\Program Files\GitHub CLI\gh.exe" repo create eliya --public --source . --remote origin --push --description "Xbox-style game portal with Pacman, Forza, Halo and more. Auto-published via Copilot." --homepage "https://nadir-yahav.github.io/eliya/"
