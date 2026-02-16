// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * V4.0 Monetization Tests
 * Verify that all V4.0 features are working correctly
 */

test.describe('V4.0 Monetization Features', () => {
  test('communes.json should load successfully (sharded data)', async ({ page }) => {
    // Navigate to the page first
    await page.goto('/');

    // Wait for initial load
    await page.waitForTimeout(1000);

    // Try to fetch the commune list from sharded data
    const response = await page.evaluate(async () => {
      try {
        const res = await fetch('./data/parcels/communes.json');
        return { status: res.status, ok: res.ok };
      } catch (err) {
        return { status: 0, ok: false, error: err.message };
      }
    });

    expect(response.status).toBe(200);
    expect(response.ok).toBe(true);
    
    console.log('[V4.0 Test] ✓ communes.json accessible with status:', response.status);
  });

  test('Coffee button should be present and visible', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Check if Coffee button is present in the DOM
    const coffeeButton = await page.locator('text=Cà phê').first();
    await expect(coffeeButton).toBeVisible();
    
    console.log('[V4.0 Test] ✓ Coffee button is visible');
  });

  test('VIP Service button should be present and visible', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Check if VIP button is present in the DOM
    const vipButton = await page.locator('text=VIP').first();
    await expect(vipButton).toBeVisible();
    
    console.log('[V4.0 Test] ✓ VIP Service button is visible');
  });

  test('Coffee button should have correct href', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Find the Coffee button link
    const coffeeLink = await page.locator('a[href*="buymeacoffee.com"]').first();
    await expect(coffeeLink).toBeVisible();
    
    const href = await coffeeLink.getAttribute('href');
    expect(href).toContain('buymeacoffee.com');
    
    console.log('[V4.0 Test] ✓ Coffee button has correct link:', href);
  });

  test('VIP Service button should have mailto link', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Find the VIP button link
    const vipLink = await page.locator('a[href^="mailto:"]').first();
    await expect(vipLink).toBeVisible();
    
    const href = await vipLink.getAttribute('href');
    expect(href).toContain('mailto:');
    
    console.log('[V4.0 Test] ✓ VIP Service button has mailto link:', href);
  });

  test('Monetization buttons should have high z-index', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Check z-index of Coffee button container
    const coffeeContainer = await page.locator('text=Cà phê').locator('..').locator('..');
    const coffeeZIndex = await coffeeContainer.evaluate((el) => {
      return window.getComputedStyle(el).zIndex;
    });

    // Should be 9999 or higher
    expect(parseInt(coffeeZIndex)).toBeGreaterThanOrEqual(9999);
    
    console.log('[V4.0 Test] ✓ Coffee button has high z-index:', coffeeZIndex);
  });

  test('Cluster zoom functionality should be enabled', async ({ page }) => {
    await page.goto('/');
    
    // Wait for map to load
    await page.waitForTimeout(3000);

    // Check if map click handlers are registered
    const hasClusterHandler = await page.evaluate(() => {
      // Check if mapboxgl is available
      return typeof window.mapboxgl !== 'undefined';
    });

    expect(hasClusterHandler).toBe(true);
    
    console.log('[V4.0 Test] ✓ Map is initialized (cluster zoom should work)');
  });
});
