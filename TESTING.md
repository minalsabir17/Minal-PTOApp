# MSW CVI PTO Tracker - Frontend Testing Guide

## Overview
This document provides instructions for running automated frontend tests using Playwright MCP for the MSW CVI PTO Tracker application.

## Prerequisites
- ✅ Playwright MCP installed (`@playwright/mcp`)
- ✅ Browser binaries installed (`npx playwright install`)
- ✅ Flask application running on `http://127.0.0.1:5000`

## Test Structure

### Basic Tests (`tests/basic.spec.js`)
- **Home page loads correctly**: Verifies main page elements and form structure
- **Navigation menu works**: Tests navigation links and routing
- **Manager login page loads**: Checks login form elements and credentials display
- **PTO request form validation**: Tests HTML5 form validation
- **Admin manager login**: Tests successful admin authentication
- **Super admin login**: Tests super admin dashboard access
- **Invalid login**: Tests error handling for wrong credentials

### Workflow Tests (`tests/pto_workflow.spec.js`)
- **Complete PTO submission and approval**: End-to-end workflow testing
- **Partial day PTO requests**: Tests time-based PTO functionality
- **Request denial workflow**: Tests rejection process with reasons

## Running Tests

### Quick Start
```bash
# Run all basic tests
npx playwright test tests/basic.spec.js --project=chromium

# Run specific test
npx playwright test --grep="Home page loads correctly"

# Run with visual browser (headed mode)
npx playwright test --headed

# Run tests with UI mode
npx playwright test --ui
```

### Using Batch Files
```batch
# Windows: Run basic tests with reporting
run_tests.bat

# Windows: Start Flask server
start_server.bat
```

### Test Commands Reference

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests |
| `npm run test:headed` | Run tests in headed mode |
| `npm run test:debug` | Run tests in debug mode |
| `npm run test:ui` | Open Playwright UI |
| `npm run show-report` | Open test report |

## Test Scenarios Covered

### ✅ User Interface Tests
- Page loading and rendering
- Form element visibility and interaction
- Navigation between pages
- Responsive design validation

### ✅ Authentication Tests
- Manager login with valid credentials
- Error handling for invalid credentials
- Role-based dashboard redirection
- Session management

### ✅ PTO Request Tests
- Team and position cascade dropdowns
- Date validation and selection
- Partial day time input toggle
- Form submission validation

### ✅ Manager Dashboard Tests
- Request viewing and filtering
- Approval/denial functionality
- Statistics display
- Calendar integration

## Test Data

### Default Manager Accounts
| Role | Email | Password |
|------|-------|----------|
| Admin | admin.manager@mswcvi.com | admin123 |
| Clinical | clinical.manager@mswcvi.com | clinical123 |
| Super Admin | superadmin@mswcvi.com | super123 |
| MOA Supervisor | moa.supervisor@mswcvi.com | moa123 |
| Echo Supervisor | echo.supervisor@mswcvi.com | echo123 |

### Test Employees
- **Clinical Team**: Daisy Melendez (CVI MOAs), Marydelle Abia (CVI RNs)
- **Admin Team**: Jessica Rodriguez (Front Desk/Admin)

## Browser Support
Tests run on multiple browsers and devices:
- ✅ Chromium (Desktop)
- ✅ Firefox (Desktop)  
- ✅ WebKit/Safari (Desktop)
- ✅ Mobile Chrome (Pixel 5)
- ✅ Mobile Safari (iPhone 12)

## Test Reports
Playwright generates comprehensive reports including:
- Test execution results
- Screenshots on failure
- Video recordings of failed tests
- Performance metrics
- Coverage information

Access reports via:
```bash
npx playwright show-report
```

## Debugging Tests

### Debug Mode
```bash
# Run specific test in debug mode
npx playwright test --debug --grep="login"
```

### Visual Debugging
```bash
# Run with browser visible
npx playwright test --headed --slow-mo=1000
```

### Screenshots and Videos
- Screenshots are automatically captured on test failures
- Videos are recorded for failed tests
- Files saved in `test-results/` directory

## Configuration

### Playwright Config (`playwright.config.js`)
- Base URL: `http://127.0.0.1:5000`
- Timeout: 30 seconds
- Retries: 2 on CI
- Reporter: HTML
- Trace collection on retry

### Environment Setup
Tests automatically start the Flask server before running and stop it after completion.

## Continuous Integration
Tests can be integrated with CI/CD pipelines:
```yaml
- name: Run Frontend Tests
  run: |
    npm install
    npx playwright test
    npx playwright show-report
```

## Troubleshooting

### Common Issues
1. **Tests not found**: Ensure test files end with `.spec.js` 
2. **Server not running**: Verify Flask app is on port 5000
3. **Browser binaries missing**: Run `npx playwright install`
4. **Flaky tests**: Increase timeouts or add explicit waits

### Performance Tips
- Use `--project=chromium` for faster single-browser testing
- Run tests in parallel with `--workers=4`
- Use `--grep` to run specific test subsets

## MCP Integration
The Playwright MCP server provides:
- Browser automation capabilities
- Cross-browser testing support
- Visual regression testing
- Performance monitoring
- Accessibility testing

## Extending Tests
To add new tests:
1. Create `.spec.js` files in `tests/` directory
2. Use Page Object Model for complex interactions
3. Add data-testid attributes to critical elements
4. Follow existing naming conventions

## Security Testing
Tests include basic security validations:
- Authentication bypass attempts
- Role-based access control
- Input validation
- CSRF protection