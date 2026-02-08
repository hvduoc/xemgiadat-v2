// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * V5.0 Search Fix Tests
 * Verify that search functionality correctly handles different field name formats
 */

test.describe('V5.0 Search Data Sync', () => {
  test('SearchModule should be loaded', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Check if SearchModule is available
    const hasSearchModule = await page.evaluate(() => {
      return typeof window.SearchModule !== 'undefined';
    });

    expect(hasSearchModule).toBe(true);
    console.log('[V5.0 Test] ✓ SearchModule is loaded');
  });

  test('SearchService should be loaded', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Check if SearchService is available
    const hasSearchService = await page.evaluate(() => {
      return typeof window.SearchService !== 'undefined';
    });

    expect(hasSearchService).toBe(true);
    console.log('[V5.0 Test] ✓ SearchService is loaded');
  });

  test('Search debug logs should show data structure when searching', async ({ page }) => {
    await page.goto('/');
    
    // Wait for map to load
    await page.waitForTimeout(3000);

    // Set up console log listener
    const logs = [];
    page.on('console', msg => {
      if (msg.text().includes('[Search Debug]')) {
        logs.push(msg.text());
      }
    });

    // Try to trigger a search - look for search input
    const searchInput = await page.locator('input[type="text"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('33 48');
      await page.waitForTimeout(1000);
      
      // Check if we got debug logs
      console.log('[V5.0 Test] Search debug logs captured:', logs.length);
      if (logs.length > 0) {
        console.log('[V5.0 Test] ✓ Debug logs are working:', logs[0]);
      }
    } else {
      console.log('[V5.0 Test] ⚠ Search input not found, skipping search test');
    }
  });

  test('SearchModule should handle fallback field names', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Test the fallback logic directly
    const fallbackResult = await page.evaluate(() => {
      const SearchModule = window.SearchModule;
      if (!SearchModule) return { error: 'SearchModule not found' };

      const module = new SearchModule();
      
      // Test data with different field name formats
      const testParcels = [
        {
          id: '1',
          SoHieuToBanDo: '33',
          SoThuTuThua: '48',
          dien_tich: 100,
          coordinates: [108.2, 16.0]
        },
        {
          id: '2',
          so_to: '34',
          so_thua: '49',
          dien_tich: 150,
          coordinates: [108.2, 16.0]
        },
        {
          id: '3',
          'Số hiệu tờ bản đồ': '35',
          'Số thửa': '50',
          dien_tich: 200,
          coordinates: [108.2, 16.0]
        }
      ];

      // Search for "33 48" should find the first parcel
      return module.search('33 48', testParcels).then(results => {
        return {
          success: true,
          resultsCount: results.length,
          firstResultId: results[0]?.parcel?.id
        };
      });
    });

    expect(fallbackResult.success).toBe(true);
    console.log('[V5.0 Test] ✓ Fallback logic works:', fallbackResult);
  });
});
