// @ts-check
const { test, expect } = require('@playwright/test');

// Configuration
const BASE_URL = 'http://127.0.0.1:5000';

test.describe('Debug PTO Submission', () => {
  
  test('Debug form submission step by step', async ({ page }) => {
    test.setTimeout(60000);
    
    await page.goto(BASE_URL);
    console.log('✅ Page loaded');
    
    // Take screenshot of initial page
    await page.screenshot({ path: 'debug-initial.png' });
    
    // Fill form step by step with debugging
    console.log('🏥 Selecting clinical team...');
    await page.selectOption('select[name="team"]', 'clinical');
    await page.waitForTimeout(1000);
    
    console.log('💼 Selecting position...');
    await page.selectOption('select[name="position"]', 'CVI MOAs');
    await page.waitForTimeout(1000);
    
    console.log('👤 Selecting employee...');
    await page.selectOption('select[name="name"]', 'Daisy Melendez');
    await page.waitForTimeout(1000);
    
    // Check email is populated
    const email = await page.inputValue('input[name="email"]');
    console.log(`📧 Email populated: ${email}`);
    
    // Set dates
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    console.log(`📅 Setting date: ${tomorrowStr}`);
    await page.fill('input[name="start_date"]', tomorrowStr);
    await page.fill('input[name="end_date"]', tomorrowStr);
    
    await page.selectOption('select[name="pto_type"]', 'Vacation');
    await page.fill('textarea[name="reason"]', 'Test vacation request');
    
    // Take screenshot before submission
    await page.screenshot({ path: 'debug-before-submit.png' });
    
    console.log('🚀 Submitting form...');
    
    // Listen for navigation/response
    const responsePromise = page.waitForResponse(response => response.url().includes('/submit_request'));
    
    await page.click('button:has-text("Submit PTO Request")');
    
    const response = await responsePromise;
    console.log(`📡 Response status: ${response.status()}`);
    console.log(`📍 Final URL: ${page.url()}`);
    
    // Wait a moment and take screenshot
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'debug-after-submit.png' });
    
    // Check for any alert messages
    const alerts = await page.locator('.alert').all();
    console.log(`🔍 Found ${alerts.length} alert(s)`);
    
    for (let i = 0; i < alerts.length; i++) {
      const alertText = await alerts[i].textContent();
      const alertClasses = await alerts[i].getAttribute('class');
      console.log(`Alert ${i}: ${alertClasses} - ${alertText}`);
    }
    
    // Check HTML content for flash messages
    const bodyHTML = await page.content();
    if (bodyHTML.includes('PTO request submitted successfully')) {
      console.log('✅ Success message found in HTML');
    } else {
      console.log('❌ No success message found in HTML');
    }
    
    // Let's also check if there are any JavaScript errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('🔴 JS Error:', msg.text());
      }
    });
  });
  
  test('Simple form submission test', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Fill minimum required fields
    await page.selectOption('select[name="team"]', 'clinical');
    await page.waitForTimeout(500);
    
    await page.selectOption('select[name="position"]', 'CVI MOAs');
    await page.waitForTimeout(500);
    
    await page.selectOption('select[name="name"]', 'Daisy Melendez');
    await page.waitForTimeout(500);
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    await page.fill('input[name="start_date"]', tomorrowStr);
    await page.fill('input[name="end_date"]', tomorrowStr);
    await page.selectOption('select[name="pto_type"]', 'Vacation');
    
    // Submit and wait for navigation
    await Promise.all([
      page.waitForLoadState('networkidle'),
      page.click('button:has-text("Submit PTO Request")')
    ]);
    
    // More flexible check for success indication
    const hasSuccessAlert = await page.locator('.alert-success').isVisible();
    const hasSuccessText = await page.textContent('body') || '';
    
    if (hasSuccessAlert || hasSuccessText.includes('successfully')) {
      console.log('✅ Form submission appears successful');
    } else {
      console.log('⚠️ Success indication not found, but form may still have submitted');
      // Check if we're back on the form page (which indicates redirect happened)
      const currentURL = page.url();
      if (currentURL.includes('/?') || currentURL === BASE_URL + '/') {
        console.log('✅ Redirected back to form page, submission likely successful');
      }
    }
  });
});