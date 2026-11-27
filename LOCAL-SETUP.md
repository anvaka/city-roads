# Run city-roads locally

Open http://127.0.0.1:8080 while the server is running.

To restart after a reboot, double-click `start-local.cmd`. Keep its window open while using the app. Close that window or press Ctrl+C to stop that instance.

Dependencies were installed using `npm ci` on Node.js 22.21.1. `npm run build` passed.

City search and road downloads require an internet connection and depend on the availability of the external map services. The original index-large-cities repository is a separate command-line downloader, saved alongside this project.

The initial background server has process ID 42144. To stop it from PowerShell, first verify it with `Get-Process -Id 42144`, then run `Stop-Process -Id 42144`.
