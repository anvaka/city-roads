@echo off
setlocal
cd /d "%~dp0"
set "TEMP=C:\Temp"
set "TMP=C:\Temp"
set "TMPDIR=C:\Temp"
if not exist "C:\Temp" mkdir "C:\Temp"
call npm.cmd run dev -- --host 127.0.0.1 --port 8080 --strictPort
pause
