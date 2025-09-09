@echo off
echo Running MSW CVI PTO Tracker Frontend Tests...
echo.

echo ========================================
echo Running Basic Functionality Tests
echo ========================================
call npx playwright test --project=chromium tests/basic.spec.js --reporter=line

echo.
echo ========================================  
echo Test Results Summary
echo ========================================
call npx playwright show-report --host=localhost --port=9323

pause