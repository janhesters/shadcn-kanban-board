import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('landing page', () => {
  test('given: an anonymous user, should: lack any automatically detectable accessibility issues', async ({
    page,
  }) => {
    // Playwright tests kept timing out due to loading image assets
    await page.route('**/*', route => {
      const resourceType = route.request().resourceType();
      if (['image'].includes(resourceType)) {
        void route.abort();
      } else {
        void route.continue();
      }
    });

    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules(['color-contrast'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
