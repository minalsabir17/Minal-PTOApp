@echo off
echo ========================================
echo MSW CVI PTO Tracker - Visual Demo
echo ========================================
echo.
echo This will demonstrate the complete PTO workflow
echo in your browser. You'll see:
echo.
echo  - Employee PTO request submissions
echo  - Manager login and approval process  
echo  - Calendar integration
echo  - System statistics
echo.
echo Press any key to start the demo...
pause > nul
echo.
echo Starting demo - watch your browser!
echo.
npx playwright test tests/visual_demo.spec.js --project=chromium --headed --workers=1 --timeout=300000
echo.
echo Demo complete!
pause