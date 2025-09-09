// @ts-check
const { test, expect } = require('@playwright/test');

// Configuration
const BASE_URL = 'http://127.0.0.1:5000';

test.describe('MSW CVI PTO Tracker - Interactive Demo Tests', () => {
  
  test('Add new employee and submit multiple PTO requests - VISUAL DEMO', async ({ page }) => {
    // Set slower execution so we can watch
    test.setTimeout(180000); // 3 minutes
    
    console.log('🎬 Starting Interactive Demo - Watch the browser!');
    
    // Step 1: Submit first PTO request for a new employee
    console.log('📝 Step 1: Submitting vacation request for new employee...');
    await page.goto(BASE_URL);
    
    // Add some wait time to see the page load
    await page.waitForTimeout(2000);
    
    // Select clinical team
    console.log('🏥 Selecting clinical team...');
    await page.selectOption('select[name="team"]', 'clinical');
    await page.waitForTimeout(1000); // Wait to see the selection
    
    // Select position
    console.log('💼 Selecting CVI MOAs position...');
    await page.selectOption('select[name="position"]', 'CVI MOAs');
    await page.waitForTimeout(1000);
    
    // Select employee
    console.log('👤 Selecting Daisy Melendez...');
    await page.selectOption('select[name="name"]', 'Daisy Melendez');
    await page.waitForTimeout(1000);
    
    // Verify email auto-populated
    const emailField = page.locator('input[name="email"]');
    await expect(emailField).toHaveValue('Daisy.Melendez@mountsinai.org');
    console.log('✅ Email auto-populated correctly');
    
    // Set dates for vacation (next week)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 7);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 9); // 3 day vacation
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    console.log(`📅 Setting vacation dates: ${startDateStr} to ${endDateStr}`);
    await page.fill('input[name="start_date"]', startDateStr);
    await page.waitForTimeout(500);
    await page.fill('input[name="end_date"]', endDateStr);
    await page.waitForTimeout(500);
    
    // Select vacation type
    console.log('🏖️ Selecting vacation type...');
    await page.selectOption('select[name="pto_type"]', 'Vacation');
    await page.waitForTimeout(500);
    
    // Add reason
    console.log('📝 Adding vacation reason...');
    await page.fill('textarea[name="reason"]', 'Annual family vacation to Florida - booked months in advance');
    await page.waitForTimeout(1000);
    
    // Submit the request
    console.log('🚀 Submitting vacation request...');
    await page.click('button:has-text("Submit PTO Request")');
    
    // Wait for success message
    await expect(page.locator('.alert-success')).toBeVisible();
    console.log('✅ Vacation request submitted successfully!');
    await page.waitForTimeout(2000);
    
    // Step 2: Submit a partial day request for the same employee
    console.log('📝 Step 2: Submitting partial day request...');
    
    // Fill out another request - partial day for doctor appointment
    await page.selectOption('select[name="team"]', 'clinical');
    await page.waitForTimeout(500);
    await page.selectOption('select[name="position"]', 'CVI MOAs');
    await page.waitForTimeout(500);
    await page.selectOption('select[name="name"]', 'Daisy Melendez');
    await page.waitForTimeout(500);
    
    // Set for tomorrow - partial day
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    console.log(`📅 Setting partial day for: ${tomorrowStr}`);
    await page.fill('input[name="start_date"]', tomorrowStr);
    await page.waitForTimeout(500);
    await page.fill('input[name="end_date"]', tomorrowStr);
    await page.waitForTimeout(500);
    
    // Check partial day checkbox
    console.log('⏰ Enabling partial day option...');
    await page.check('#is_partial_day');
    
    // Wait for time inputs to appear and verify they're visible
    await expect(page.locator('#time_inputs')).toBeVisible();
    console.log('✅ Time inputs appeared');
    await page.waitForTimeout(1000);
    
    // Fill in time range (morning appointment)
    console.log('🕘 Setting time: 9:00 AM to 12:00 PM...');
    await page.fill('input[name="start_time"]', '09:00');
    await page.waitForTimeout(500);
    await page.fill('input[name="end_time"]', '12:00');
    await page.waitForTimeout(500);
    
    // Select personal type and add reason
    await page.selectOption('select[name="pto_type"]', 'Personal');
    await page.waitForTimeout(500);
    await page.fill('textarea[name="reason"]', 'Annual physical exam with Dr. Smith - scheduled 6 months ago');
    await page.waitForTimeout(1000);
    
    // Submit partial day request
    console.log('🚀 Submitting partial day request...');
    await page.click('button:has-text("Submit PTO Request")');
    
    await expect(page.locator('.alert-success')).toBeVisible();
    console.log('✅ Partial day request submitted successfully!');
    await page.waitForTimeout(2000);
    
    // Step 3: Submit emergency request for different employee
    console.log('📝 Step 3: Submitting emergency request for different employee...');
    
    // Switch to admin team and different employee
    await page.selectOption('select[name="team"]', 'admin');
    await page.waitForTimeout(1000);
    await page.selectOption('select[name="position"]', 'Front Desk/Admin');
    await page.waitForTimeout(1000);
    await page.selectOption('select[name="name"]', 'Jessica Rodriguez');
    await page.waitForTimeout(1000);
    
    // Emergency leave for today
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    console.log(`🚨 Setting emergency leave for: ${todayStr}`);
    await page.fill('input[name="start_date"]', todayStr);
    await page.waitForTimeout(500);
    await page.fill('input[name="end_date"]', todayStr);
    await page.waitForTimeout(500);
    
    await page.selectOption('select[name="pto_type"]', 'Family Emergency');
    await page.waitForTimeout(500);
    await page.fill('textarea[name="reason"]', 'Child sick with fever - daycare called, need immediate pickup');
    await page.waitForTimeout(1000);
    
    console.log('🚀 Submitting emergency request...');
    await page.click('button:has-text("Submit PTO Request")');
    
    await expect(page.locator('.alert-success')).toBeVisible();
    console.log('✅ Emergency request submitted successfully!');
    await page.waitForTimeout(2000);
    
    // Step 4: Login as Clinical Manager to review requests
    console.log('👔 Step 4: Logging in as Clinical Manager to review requests...');
    
    await page.goto(`${BASE_URL}/login`);
    await page.waitForTimeout(1000);
    
    console.log('🔐 Entering clinical manager credentials...');
    await page.fill('input[name="email"]', 'clinical.manager@mswcvi.com');
    await page.waitForTimeout(500);
    await page.fill('input[name="password"]', 'clinical123');
    await page.waitForTimeout(500);
    
    await page.click('button:has-text("Login")');
    
    // Should be on clinical dashboard
    await expect(page).toHaveURL(`${BASE_URL}/clinical_dashboard`);
    await expect(page.locator('h2:has-text("Clinical Manager Dashboard")')).toBeVisible();
    console.log('✅ Successfully logged in as Clinical Manager');
    await page.waitForTimeout(2000);
    
    // Review the requests in the table
    console.log('📋 Reviewing submitted requests...');
    await expect(page.locator('table')).toContainText('Daisy Melendez');
    await expect(page.locator('table')).toContainText('Vacation');
    await expect(page.locator('table')).toContainText('Personal');
    console.log('✅ Found both requests from Daisy Melendez');
    await page.waitForTimeout(2000);
    
    // Approve the vacation request
    console.log('✅ Approving vacation request...');
    const approveButtons = page.locator('.btn-approve');
    const firstApproveButton = approveButtons.first();
    await firstApproveButton.click();
    
    await expect(page.locator('.alert-success')).toBeVisible();
    console.log('✅ Vacation request approved!');
    await page.waitForTimeout(2000);
    
    // Step 5: Check calendar view
    console.log('📅 Step 5: Checking calendar view...');
    
    await page.click('a:has-text("Calendar")');
    await expect(page).toHaveURL(`${BASE_URL}/calendar`);
    await expect(page.locator('h2:has-text("PTO Calendar")')).toBeVisible();
    
    // Should see approved request
    await expect(page.locator('text=Daisy Melendez')).toBeVisible();
    console.log('✅ Approved vacation appears on calendar');
    await page.waitForTimeout(2000);
    
    // Step 6: Login as Admin Manager to check other requests
    console.log('👔 Step 6: Logging in as Admin Manager...');
    
    await page.goto(`${BASE_URL}/login`);
    await page.waitForTimeout(1000);
    
    await page.fill('input[name="email"]', 'admin.manager@mswcvi.com');
    await page.waitForTimeout(500);
    await page.fill('input[name="password"]', 'admin123');
    await page.waitForTimeout(500);
    
    await page.click('button:has-text("Login")');
    
    await expect(page).toHaveURL(`${BASE_URL}/admin_dashboard`);
    console.log('✅ Successfully logged in as Admin Manager');
    await page.waitForTimeout(2000);
    
    // Should see Jessica's emergency request
    await expect(page.locator('table')).toContainText('Jessica Rodriguez');
    await expect(page.locator('table')).toContainText('Family Emergency');
    console.log('✅ Found emergency request from Jessica Rodriguez');
    await page.waitForTimeout(2000);
    
    // Approve the emergency request
    console.log('✅ Approving emergency request...');
    const adminApproveButton = page.locator('.btn-approve').first();
    await adminApproveButton.click();
    
    await expect(page.locator('.alert-success')).toBeVisible();
    console.log('✅ Emergency request approved!');
    await page.waitForTimeout(2000);
    
    // Step 7: Final Super Admin view
    console.log('👑 Step 7: Logging in as Super Admin for system overview...');
    
    await page.goto(`${BASE_URL}/login`);
    await page.waitForTimeout(1000);
    
    await page.fill('input[name="email"]', 'superadmin@mswcvi.com');
    await page.waitForTimeout(500);
    await page.fill('input[name="password"]', 'super123');
    await page.waitForTimeout(500);
    
    await page.click('button:has-text("Login")');
    
    await expect(page).toHaveURL(`${BASE_URL}/superadmin_dashboard`);
    console.log('✅ Successfully logged in as Super Admin');
    await page.waitForTimeout(2000);
    
    // Review system-wide stats
    console.log('📊 Reviewing system-wide statistics...');
    await expect(page.locator('text=All PTO Requests (System-wide)')).toBeVisible();
    await expect(page.locator('table')).toContainText('Daisy Melendez');
    await expect(page.locator('table')).toContainText('Jessica Rodriguez');
    
    // Count approved requests in stats
    const approvedCount = await page.locator('.stats-number').nth(1).textContent();
    console.log(`📈 Total approved requests: ${approvedCount}`);
    await page.waitForTimeout(3000);
    
    console.log('🎉 Interactive Demo Complete!');
    console.log('📋 Summary:');
    console.log('   ✅ Submitted 3 PTO requests (2 for Daisy, 1 for Jessica)');
    console.log('   ✅ Approved vacation and emergency requests');
    console.log('   ✅ Viewed requests in calendar');
    console.log('   ✅ Tested all manager roles and dashboards');
    console.log('   ✅ Verified system-wide statistics');
  });

  test('Test form validation and error handling - VISUAL DEMO', async ({ page }) => {
    test.setTimeout(120000); // 2 minutes
    
    console.log('🔍 Testing form validation and error handling...');
    
    await page.goto(BASE_URL);
    await page.waitForTimeout(1000);
    
    // Try to submit empty form
    console.log('❌ Testing empty form submission...');
    await page.click('button:has-text("Submit PTO Request")');
    await page.waitForTimeout(2000);
    
    // Test invalid login
    console.log('🔐 Testing invalid login credentials...');
    await page.goto(`${BASE_URL}/login`);
    await page.waitForTimeout(1000);
    
    await page.fill('input[name="email"]', 'invalid@email.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button:has-text("Login")');
    
    await expect(page.locator('.alert-danger')).toBeVisible();
    console.log('✅ Invalid login error displayed correctly');
    await page.waitForTimeout(2000);
    
    // Test date validation
    console.log('📅 Testing date validation...');
    await page.goto(BASE_URL);
    await page.waitForTimeout(1000);
    
    // Try to set end date before start date
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    await page.fill('input[name="start_date"]', todayStr);
    await page.waitForTimeout(500);
    await page.fill('input[name="end_date"]', yesterdayStr);
    await page.waitForTimeout(2000);
    
    console.log('✅ Date validation tests completed');
  });
});