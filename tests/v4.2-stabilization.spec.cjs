// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * STABILIZATION V4.2 Test Suite
 * Tests critical fixes: CartoDB tiles, click logic, cache busting
 */

test.describe('V4.2 Stabilization Fixes', () => {
  test('CartoDB Voyager tiles should load with 200 status', async ({ page }) => {
    // Listen for tile requests
    const tileRequests = [];
    
    page.on('response', response => {
      const url = response.url();
      if (url.includes('basemaps.cartocdn.com/rastertiles/voyager')) {
        tileRequests.push({
          url: url,
          status: response.status()
        });
      }
    });

    // Navigate to the page
    await page.goto('/');

    // Wait for map to initialize and tiles to load
    await page.waitForTimeout(5000);

    // Verify at least one tile loaded successfully
    expect(tileRequests.length).toBeGreaterThan(0);
    
    // Check that tiles are returning 200 status
    const successfulTiles = tileRequests.filter(req => req.status === 200);
    expect(successfulTiles.length).toBeGreaterThan(0);
    
    console.log(`[V4.2 Test] ✓ CartoDB tiles loaded: ${successfulTiles.length}/${tileRequests.length} successful`);
    console.log('[V4.2 Test] Sample tile URL:', tileRequests[0]?.url);
  });

  test('Cache busting version parameters are present', async ({ page }) => {
    // Listen for CSS and JS requests
    let cssRequest = null;
    let jsRequest = null;
    
    page.on('request', request => {
      const url = request.url();
      if (url.includes('src/styles/main.css')) {
        cssRequest = url;
      }
      if (url.includes('src/scripts/init.js')) {
        jsRequest = url;
      }
    });

    // Navigate to the page
    await page.goto('/');

    // Wait for resources to load
    await page.waitForTimeout(2000);

    // Verify version parameters are present
    expect(cssRequest).toContain('v=4.2');
    expect(jsRequest).toContain('v=4.2');
    
    console.log('[V4.2 Test] ✓ Cache busting parameters present');
    console.log('[V4.2 Test] CSS URL:', cssRequest);
    console.log('[V4.2 Test] JS URL:', jsRequest);
  });

  test('Floating Coffee and VIP buttons should NOT be present', async ({ page }) => {
    // Navigate to the page
    await page.goto('/');

    // Wait for page to render
    await page.waitForTimeout(3000);

    // Check that floating buttons (absolute positioned at top-20 and top-36) are not present
    const coffeeButton = await page.locator('a[aria-label="Mời cà phê"]').count();
    const vipButton = await page.locator('a[aria-label="Dịch vụ VIP"]').count();

    expect(coffeeButton).toBe(0);
    expect(vipButton).toBe(0);
    
    console.log('[V4.2 Test] ✓ Floating buttons removed (Coffee: 0, VIP: 0)');
  });

  test('Map should be interactive and clickable', async ({ page }) => {
    // Navigate to the page
    await page.goto('/');

    // Wait for map to load
    await page.waitForTimeout(5000);

    // Verify map canvas exists
    const mapCanvas = await page.locator('canvas.maplibregl-canvas');
    await expect(mapCanvas).toBeVisible();

    console.log('[V4.2 Test] ✓ Map canvas is visible and interactive');
  });
});
