// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * HOTFIX Test: Verify GitHub Pages paths work correctly
 * Tests that all critical resources load with 200 status
 */

test.describe('GitHub Pages Path Fixes', () => {
  test('main.css should load successfully (200 status)', async ({ page }) => {
    // Listen for the CSS file request
    let cssResponse = null;
    
    page.on('response', response => {
      if (response.url().includes('src/styles/main.css')) {
        cssResponse = response;
      }
    });

    // Navigate to the page
    await page.goto('/');

    // Wait for CSS to load
    await page.waitForTimeout(2000);

    // Verify CSS loaded successfully
    expect(cssResponse).not.toBeNull();
    expect(cssResponse.status()).toBe(200);
    
    console.log('[HOTFIX Test] ✓ main.css loaded with status:', cssResponse.status());
  });

  test('init.js should load successfully (200 status)', async ({ page }) => {
    // Listen for the init.js file request
    let initJsResponse = null;
    
    page.on('response', response => {
      if (response.url().includes('src/scripts/init.js')) {
        initJsResponse = response;
      }
    });

    // Navigate to the page
    await page.goto('/');

    // Wait for script to load
    await page.waitForTimeout(2000);

    // Verify init.js loaded successfully
    expect(initJsResponse).not.toBeNull();
    expect(initJsResponse.status()).toBe(200);
    
    console.log('[HOTFIX Test] ✓ init.js loaded with status:', initJsResponse.status());
  });

  test('land-law-2024.json should be accessible (200 status)', async ({ page }) => {
    // Navigate to the page first
    await page.goto('/');

    // Wait for initial load
    await page.waitForTimeout(1000);

    // Try to fetch the JSON file directly
    const response = await page.evaluate(async () => {
      try {
        const res = await fetch('./data/land-law-2024.json');
        return { status: res.status, ok: res.ok };
      } catch (err) {
        return { status: 0, ok: false, error: err.message };
      }
    });

    expect(response.status).toBe(200);
    expect(response.ok).toBe(true);
    
    console.log('[HOTFIX Test] ✓ land-law-2024.json accessible with status:', response.status);
  });

  test('critical inline scripts should be present', async ({ page }) => {
    await page.goto('/');

    // Check if __trackCDN function exists
    const hasTrackCDN = await page.evaluate(() => {
      return typeof window.__trackCDN === 'function';
    });

    // Check if __CDN_LOAD_STATUS__ exists
    const hasCDNStatus = await page.evaluate(() => {
      return typeof window.__CDN_LOAD_STATUS__ === 'object';
    });

    expect(hasTrackCDN).toBe(true);
    expect(hasCDNStatus).toBe(true);
    
    console.log('[HOTFIX Test] ✓ Critical inline scripts are present');
  });

  test('PMTiles protocol should be registered', async ({ page }) => {
    await page.goto('/');

    // Wait for PMTiles to load and register
    await page.waitForTimeout(3000);

    // Check if PMTiles protocol is registered
    const isPMTilesRegistered = await page.evaluate(() => {
      return window.__pmtiles_registered === true || typeof window.pmtiles !== 'undefined';
    });

    expect(isPMTilesRegistered).toBe(true);
    
    console.log('[HOTFIX Test] ✓ PMTiles protocol registered');
  });

  test('page should not have White Screen of Death', async ({ page }) => {
    await page.goto('/');

    // Wait for app to initialize
    await page.waitForTimeout(3000);

    // Check if root element has content
    const rootHasContent = await page.evaluate(() => {
      const root = document.getElementById('root');
      return root && root.innerHTML.length > 0;
    });

    expect(rootHasContent).toBe(true);
    
    console.log('[HOTFIX Test] ✓ Page renders content (no WSOD)');
  });
});
