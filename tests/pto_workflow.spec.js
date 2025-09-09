// @ts-check
const { test, expect } = require('@playwright/test');

// Configuration
const BASE_URL = 'http://127.0.0.1:5000';

test.describe('MSW CVI PTO Tracker - Complete Workflow Tests', () => {
  
  test('Complete PTO submission and approval workflow', async ({ page }) => {
    // Step 1: Submit a PTO request
    await page.goto(BASE_URL);
    
    // Fill out the form step by step
    await page.selectOption('select[name="team"]', 'clinical');
    await page.waitForTimeout(500); // Wait for positions to load
    
    await page.selectOption('select[name="position"]', 'CVI MOAs');
    await page.waitForTimeout(500); // Wait for names to load
    
    await page.selectOption('select[name="name"]', 'Daisy Melendez');
    await page.waitForTimeout(500); // Wait for email to auto-populate
    
    // Verify email was auto-populated
    const emailField = page.locator('input[name="email"]');
    await expect(emailField).toHaveValue('Daisy.Melendez@mountsinai.org');
    
    // Set dates (tomorrow and day after)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const dayAfterStr = dayAfter.toISOString().split('T')[0];
    
    await page.fill('input[name="start_date"]', tomorrowStr);
    await page.fill('input[name="end_date"]', dayAfterStr);
    
    // Select PTO type
    await page.selectOption('select[name="pto_type"]', 'Vacation');
    
    // Add a reason
    await page.fill('textarea[name="reason"]', 'Family vacation - planned in advance');
    
    // Submit the request
    await page.click('button:has-text("Submit PTO Request")');
    
    // Verify success message appears
    await expect(page.locator('.alert-success')).toBeVisible();
    await expect(page.locator('.alert-success')).toContainText('PTO request submitted successfully');
    
    // Step 2: Login as Clinical Manager to approve the request
    await page.goto(`${BASE_URL}/login`);
    
    await page.fill('input[name="email"]', 'clinical.manager@mswcvi.com');
    await page.fill('input[name="password"]', 'clinical123');
    await page.click('button:has-text("Login")');
    
    // Should be redirected to clinical dashboard
    await expect(page).toHaveURL(`${BASE_URL}/clinical_dashboard`);
    await expect(page.locator('h2:has-text("Clinical Manager Dashboard")')).toBeVisible();
    
    // Find the submitted request in the table
    await expect(page.locator('table')).toContainText('Daisy Melendez');
    await expect(page.locator('table')).toContainText('Vacation');
    await expect(page.locator('table')).toContainText('Pending');
    
    // Approve the request (click the first approve button)
    const approveButton = page.locator('.btn-approve').first();
    await approveButton.click();
    
    // Verify approval was successful
    await expect(page.locator('.alert-success')).toBeVisible();
    await expect(page.locator('.alert-success')).toContainText('Request approved successfully');
    
    // Step 3: Check calendar view for the approved request
    await page.click('a:has-text("Calendar")');
    await expect(page).toHaveURL(`${BASE_URL}/calendar`);
    
    // Should see the approved request in the calendar
    await expect(page.locator('text=Daisy Melendez')).toBeVisible();
    await expect(page.locator('text=Vacation')).toBeVisible();
    
    // Step 4: Login as Super Admin to view system-wide stats
    await page.goto(`${BASE_URL}/login`);
    
    await page.fill('input[name="email"]', 'superadmin@mswcvi.com');
    await page.fill('input[name="password"]', 'super123');
    await page.click('button:has-text("Login")');
    
    await expect(page).toHaveURL(`${BASE_URL}/superadmin_dashboard`);
    
    // Should see the approved request in the super admin view
    await expect(page.locator('table')).toContainText('Daisy Melendez');
    await expect(page.locator('.badge:has-text("Approved")')).toBeVisible();
  });

  test('Partial day PTO request workflow', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Submit a partial day request
    await page.selectOption('select[name="team"]', 'admin');
    await page.waitForTimeout(500);
    
    await page.selectOption('select[name="position"]', 'Front Desk/Admin');
    await page.waitForTimeout(500);
    
    await page.selectOption('select[name="name"]', 'Jessica Rodriguez');
    
    // Set for tomorrow only
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    await page.fill('input[name="start_date"]', tomorrowStr);
    await page.fill('input[name="end_date"]', tomorrowStr);
    
    // Check partial day checkbox
    await page.check('#is_partial_day');
    
    // Time inputs should now be visible
    await expect(page.locator('#time_inputs')).toBeVisible();
    
    // Fill in times
    await page.fill('input[name="start_time"]', '09:00');
    await page.fill('input[name="end_time"]', '12:00');
    
    await page.selectOption('select[name="pto_type"]', 'Personal');
    await page.fill('textarea[name="reason"]', 'Doctor appointment');
    
    // Submit the request
    await page.click('button:has-text("Submit PTO Request")');
    
    // Verify success
    await expect(page.locator('.alert-success')).toBeVisible();
    
    // Login as admin manager to see the request
    await page.goto(`${BASE_URL}/login`);
    
    await page.fill('input[name="email"]', 'admin.manager@mswcvi.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button:has-text("Login")');
    
    // Should see the partial day request
    await expect(page.locator('table')).toContainText('Jessica Rodriguez');
    await expect(page.locator('table')).toContainText('Personal');
    await expect(page.locator('.badge:has-text("Partial Day")')).toBeVisible();
  });

  test('Request denial workflow', async ({ page }) => {
    // Submit a request
    await page.goto(BASE_URL);
    
    await page.selectOption('select[name="team"]', 'clinical');
    await page.waitForTimeout(500);
    await page.selectOption('select[name="position"]', 'CVI RNs');
    await page.waitForTimeout(500);
    await page.selectOption('select[name="name"]', 'Marydelle Abia');
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    await page.fill('input[name="start_date"]', tomorrowStr);
    await page.fill('input[name="end_date"]', tomorrowStr);
    await page.selectOption('select[name="pto_type"]', 'Sick Leave');
    
    await page.click('button:has-text("Submit PTO Request")');
    await expect(page.locator('.alert-success')).toBeVisible();
    
    // Login as clinical manager
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]', 'clinical.manager@mswcvi.com');
    await page.fill('input[name="password"]', 'clinical123');
    await page.click('button:has-text("Login")');
    
    // Find and deny the request
    await expect(page.locator('table')).toContainText('Marydelle Abia');
    
    // Set up dialog handler for the denial reason prompt
    page.on('dialog', async dialog => {
      expect(dialog.type()).toBe('prompt');
      expect(dialog.message()).toContain('reason for denial');
      await dialog.accept('Insufficient staffing coverage for this date');
    });
    
    // Click the deny button
    const denyButton = page.locator('.btn-deny').first();
    await denyButton.click();
    
    // Verify denial was successful
    await expect(page.locator('.alert-success')).toBeVisible();
    await expect(page.locator('.alert-success')).toContainText('Request denied successfully');
  });
});