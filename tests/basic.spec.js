// @ts-check
const { test, expect } = require('@playwright/test');

// Configuration
const BASE_URL = 'http://127.0.0.1:5000';

test.describe('MSW CVI PTO Tracker - Basic Tests', () => {
  
  test('Home page loads correctly', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Check that the page title is correct
    await expect(page).toHaveTitle(/MSW CVI PTO Tracker/);
    
    // Check for key elements on the home page
    await expect(page.locator('h4:has-text("Submit PTO Request")')).toBeVisible();
    await expect(page.locator('select[name="team"]')).toBeVisible();
    await expect(page.locator('select[name="position"]')).toBeVisible();
    await expect(page.locator('input[name="start_date"]')).toBeVisible();
    await expect(page.locator('input[name="end_date"]')).toBeVisible();
  });

  test('Navigation menu works', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Check navigation links
    await expect(page.locator('a:has-text("Submit Request")')).toBeVisible();
    await expect(page.locator('a:has-text("Calendar")')).toBeVisible();
    await expect(page.locator('a:has-text("Manager Login")')).toBeVisible();
    
    // Test calendar navigation
    await page.click('a:has-text("Calendar")');
    await expect(page).toHaveURL(`${BASE_URL}/calendar`);
    await expect(page.locator('h2:has-text("PTO Calendar")')).toBeVisible();
  });

  test('Manager login page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // Check login form elements
    await expect(page.locator('h4:has-text("Manager Login")')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Login")')).toBeVisible();
    
    // Check development credentials are displayed
    await expect(page.locator('text=Development Login Credentials')).toBeVisible();
    await expect(page.locator('text=admin.manager@mswcvi.com')).toBeVisible();
  });

  test('PTO request form validation', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Try to submit empty form
    await page.click('button:has-text("Submit PTO Request")');
    
    // Check that HTML5 validation prevents submission
    const teamSelect = page.locator('select[name="team"]');
    await expect(teamSelect).toHaveAttribute('required');
    
    const positionSelect = page.locator('select[name="position"]');
    await expect(positionSelect).toHaveAttribute('required');
  });
});

test.describe('MSW CVI PTO Tracker - Manager Login Tests', () => {
  
  test('Admin manager can login successfully', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // Fill in admin credentials
    await page.fill('input[name="email"]', 'admin.manager@mswcvi.com');
    await page.fill('input[name="password"]', 'admin123');
    
    // Submit the form
    await page.click('button:has-text("Login")');
    
    // Check that we're redirected to admin dashboard
    await expect(page).toHaveURL(`${BASE_URL}/admin_dashboard`);
    await expect(page.locator('h2:has-text("Admin Manager Dashboard")')).toBeVisible();
    
    // Check that user name appears in navigation dropdown
    await expect(page.locator('#userDropdown')).toContainText('Admin Manager');
  });

  test('Super admin can login and see all requests', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // Fill in super admin credentials
    await page.fill('input[name="email"]', 'superadmin@mswcvi.com');
    await page.fill('input[name="password"]', 'super123');
    
    // Submit the form
    await page.click('button:has-text("Login")');
    
    // Check that we're redirected to super admin dashboard
    await expect(page).toHaveURL(`${BASE_URL}/superadmin_dashboard`);
    await expect(page.locator('h2:has-text("Super Admin Dashboard")')).toBeVisible();
    
    // Check for system-wide view
    await expect(page.locator('text=All PTO Requests (System-wide)')).toBeVisible();
  });

  test('Invalid login credentials show error', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // Fill in invalid credentials
    await page.fill('input[name="email"]', 'invalid@email.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    
    // Submit the form
    await page.click('button:has-text("Login")');
    
    // Check that error message appears
    await expect(page.locator('.alert-danger')).toBeVisible();
    await expect(page.locator('text=Invalid email or password')).toBeVisible();
  });
});

test.describe('MSW CVI PTO Tracker - PTO Request Flow', () => {
  
  test('Can select team and position cascade', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Select clinical team
    await page.selectOption('select[name="team"]', 'clinical');
    
    // Wait for positions to populate and check some options
    await page.waitForTimeout(500); // Give JavaScript time to populate
    
    // Check that position dropdown has options
    const positionOptions = await page.locator('select[name="position"] option').count();
    expect(positionOptions).toBeGreaterThan(1); // Should have more than just the placeholder
    
    // Select a position
    await page.selectOption('select[name="position"]', 'CVI MOAs');
    
    // Wait for names to populate
    await page.waitForTimeout(500);
    
    // Check that name dropdown has options
    const nameOptions = await page.locator('select[name="name"] option').count();
    expect(nameOptions).toBeGreaterThan(1);
  });

  test('Partial day checkbox shows time inputs', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Time inputs should be hidden initially
    await expect(page.locator('#time_inputs')).toBeHidden();
    
    // Click partial day checkbox
    await page.check('#is_partial_day');
    
    // Time inputs should now be visible
    await expect(page.locator('#time_inputs')).toBeVisible();
    await expect(page.locator('input[name="start_time"]')).toBeVisible();
    await expect(page.locator('input[name="end_time"]')).toBeVisible();
  });

  test('Date validation works correctly', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Check that start date has today as minimum
    const today = new Date().toISOString().split('T')[0];
    const startDateMin = await page.locator('input[name="start_date"]').getAttribute('min');
    expect(startDateMin).toBe(today);
  });
});