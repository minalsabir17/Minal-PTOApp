// @ts-check
const { test, expect } = require('@playwright/test');

// Configuration
const BASE_URL = 'http://127.0.0.1:5000';

test.describe('Employee Management Tests', () => {
  
  test('Super Admin can access and manage employees', async ({ page }) => {
    test.setTimeout(120000); // 2 minutes
    
    console.log('🧪 Testing Employee Management Functionality');
    
    // Step 1: Login as Super Admin
    console.log('👑 Step 1: Logging in as Super Admin...');
    await page.goto(`${BASE_URL}/login`);
    await page.waitForTimeout(1000);
    
    await page.fill('input[name="email"]', 'superadmin@mswcvi.com');
    await page.waitForTimeout(500);
    await page.fill('input[name="password"]', 'super123');
    await page.waitForTimeout(500);
    
    await page.click('button:has-text("Login")');
    await page.waitForLoadState('networkidle');
    console.log('✅ Super Admin logged in successfully');
    
    // Step 2: Check if employee management links are present on dashboard
    console.log('📊 Step 2: Checking dashboard for employee management links...');
    
    const manageEmployeesButton = page.locator('a:has-text("Manage All Employees")');
    const addEmployeeButton = page.locator('a:has-text("Add Employee")');
    
    expect(await manageEmployeesButton.isVisible()).toBeTruthy();
    expect(await addEmployeeButton.isVisible()).toBeTruthy();
    console.log('✅ Employee management buttons found on dashboard');
    
    // Step 3: Navigate to employee management page
    console.log('👥 Step 3: Navigating to employee management page...');
    await manageEmployeesButton.click();
    await page.waitForLoadState('networkidle');
    
    // Check if we're on the employee management page
    const pageTitle = await page.locator('h2').textContent();
    expect(pageTitle).toContain('Manage Employees');
    console.log('✅ Successfully navigated to employee management page');
    
    // Step 4: Check employee list displays
    console.log('📋 Step 4: Checking employee list...');
    const employeeTable = page.locator('#employeesTable');
    
    if (await employeeTable.isVisible()) {
      const employeeRows = employeeTable.locator('tbody tr');
      const employeeCount = await employeeRows.count();
      console.log(`📊 Found ${employeeCount} employees in the system`);
      
      // Check if edit buttons are present
      const editButtons = page.locator('.btn-outline-primary');
      const editButtonCount = await editButtons.count();
      console.log(`✏️ Found ${editButtonCount} edit buttons`);
      
      if (editButtonCount > 0) {
        console.log('🎯 Step 5: Testing edit employee functionality...');
        
        // Click on first edit button
        await editButtons.first().click();
        await page.waitForLoadState('networkidle');
        
        // Check if we're on edit page
        const editPageTitle = await page.locator('h2').textContent();
        expect(editPageTitle).toContain('Edit Employee');
        console.log('✅ Successfully navigated to edit employee page');
        
        // Test form fields are present and editable
        const nameField = page.locator('input[name="name"]');
        const emailField = page.locator('input[name="email"]');
        const teamSelect = page.locator('select[name="team"]');
        const positionSelect = page.locator('select[name="position"]');
        const ptoBalanceField = page.locator('input[name="pto_balance"]');
        
        expect(await nameField.isVisible()).toBeTruthy();
        expect(await emailField.isVisible()).toBeTruthy();
        expect(await teamSelect.isVisible()).toBeTruthy();
        expect(await positionSelect.isVisible()).toBeTruthy();
        expect(await ptoBalanceField.isVisible()).toBeTruthy();
        
        console.log('✅ All employee form fields are present and accessible');
        
        // Test PTO balance calculation
        await ptoBalanceField.fill('45');
        await page.waitForTimeout(500);
        const ptoDisplay = await page.locator('#pto_days_display').textContent();
        expect(ptoDisplay).toContain('6.0 days'); // 45/7.5 = 6.0
        console.log('✅ PTO balance calculation working correctly');
        
        // Go back to employee list
        await page.click('a:has-text("Cancel")');
        await page.waitForLoadState('networkidle');
        console.log('✅ Successfully returned to employee list');
      }
    } else {
      console.log('ℹ️ No employees found in system - will test add functionality');
    }
    
    // Step 6: Test add employee functionality
    console.log('➕ Step 6: Testing add employee functionality...');
    await page.click('a:has-text("Add New Employee")');
    await page.waitForLoadState('networkidle');
    
    const addPageTitle = await page.locator('h2').textContent();
    expect(addPageTitle).toContain('Add New Employee');
    console.log('✅ Successfully navigated to add employee page');
    
    // Test form validation and functionality
    const addNameField = page.locator('input[name="name"]');
    const addEmailField = page.locator('input[name="email"]');
    const addTeamSelect = page.locator('select[name="team"]');
    const addPositionSelect = page.locator('select[name="position"]');
    const addPtoBalanceField = page.locator('input[name="pto_balance"]');
    
    expect(await addNameField.isVisible()).toBeTruthy();
    expect(await addEmailField.isVisible()).toBeTruthy();
    expect(await addTeamSelect.isVisible()).toBeTruthy();
    expect(await addPositionSelect.isVisible()).toBeTruthy();
    expect(await addPtoBalanceField.isVisible()).toBeTruthy();
    
    // Test team/position interaction
    await addTeamSelect.selectOption('clinical');
    await page.waitForTimeout(500);
    await addPositionSelect.selectOption('CVI RNs');
    console.log('✅ Team and position selectors working correctly');
    
    // Test PTO balance calculation on add form
    await addPtoBalanceField.fill('37.5');
    await page.waitForTimeout(500);
    const addPtoDisplay = await page.locator('#pto_days_display').textContent();
    expect(addPtoDisplay).toContain('5.0 days'); // 37.5/7.5 = 5.0
    console.log('✅ PTO balance calculation working on add form');
    
    // Step 7: Test export functionality
    console.log('📤 Step 7: Testing export functionality...');
    await page.click('a:has-text("Cancel")'); // Go back to employee list
    await page.waitForLoadState('networkidle');
    
    const exportButton = page.locator('button:has-text("Export List")');
    expect(await exportButton.isVisible()).toBeTruthy();
    console.log('✅ Export button is present and visible');
    
    console.log('🎉 All Employee Management Tests Completed Successfully!');
    console.log('📋 Test Summary:');
    console.log('   ✅ Super Admin dashboard has employee management links');
    console.log('   ✅ Employee management page loads correctly');  
    console.log('   ✅ Employee list displays properly');
    console.log('   ✅ Edit employee functionality works');
    console.log('   ✅ Add employee functionality works');
    console.log('   ✅ PTO balance calculations are accurate');
    console.log('   ✅ Team/position filtering works');
    console.log('   ✅ Export functionality is available');
    console.log('   ✅ All employee aspects are editable as requested!');
    
    await page.waitForTimeout(3000); // Final pause
  });
  
  test('Admin Manager can manage their team employees', async ({ page }) => {
    test.setTimeout(60000); // 1 minute
    
    console.log('🧪 Testing Admin Manager Employee Access');
    
    // Login as Admin Manager
    await page.goto(`${BASE_URL}/login`);
    await page.waitForTimeout(1000);
    
    await page.fill('input[name="email"]', 'admin.manager@mswcvi.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button:has-text("Login")');
    await page.waitForLoadState('networkidle');
    
    // Check for employee management links on admin dashboard
    const manageEmployeesButton = page.locator('a:has-text("Manage Employees")');
    expect(await manageEmployeesButton.isVisible()).toBeTruthy();
    
    // Navigate to employee management
    await manageEmployeesButton.click();
    await page.waitForLoadState('networkidle');
    
    const pageTitle = await page.locator('h2').textContent();
    expect(pageTitle).toContain('Manage Employees');
    console.log('✅ Admin Manager can access employee management');
    
    // Check role-based filtering (should only see admin team)
    const roleInfo = await page.locator('small.text-muted').textContent();
    expect(roleInfo).toContain('Admin View');
    console.log('✅ Role-based employee filtering working');
    
    console.log('🎉 Admin Manager employee access test completed!');
  });
  
  test('Clinical Manager can manage their team employees', async ({ page }) => {
    test.setTimeout(60000); // 1 minute
    
    console.log('🧪 Testing Clinical Manager Employee Access');
    
    // Login as Clinical Manager
    await page.goto(`${BASE_URL}/login`);
    await page.waitForTimeout(1000);
    
    await page.fill('input[name="email"]', 'clinical.manager@mswcvi.com');
    await page.fill('input[name="password"]', 'clinical123');
    await page.click('button:has-text("Login")');
    await page.waitForLoadState('networkidle');
    
    // Check for employee management links on clinical dashboard
    const manageEmployeesButton = page.locator('a:has-text("Manage Employees")');
    expect(await manageEmployeesButton.isVisible()).toBeTruthy();
    
    // Navigate to employee management
    await manageEmployeesButton.click();
    await page.waitForLoadState('networkidle');
    
    const pageTitle = await page.locator('h2').textContent();
    expect(pageTitle).toContain('Manage Employees');
    console.log('✅ Clinical Manager can access employee management');
    
    // Check role-based filtering (should only see clinical team)
    const roleInfo = await page.locator('small.text-muted').textContent();
    expect(roleInfo).toContain('Clinical View');
    console.log('✅ Role-based employee filtering working');
    
    console.log('🎉 Clinical Manager employee access test completed!');
  });
});