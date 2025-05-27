import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const path = '/pricing';

test.describe('pricing page', () => {
  test('given: an anonymous user, should: show correct page title and headings', async ({
    page,
  }) => {
    await page.goto(path);

    // Check page title
    await expect(page).toHaveTitle(/pricing/i);

    // Check main headings
    await expect(
      page.getByRole('heading', { name: /pricing/i, level: 1 }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /choose your plan/i, level: 2 }),
    ).toBeVisible();

    // Check description text
    await expect(
      page.getByText(
        /choose the plan that fits your needs\. all plans come with a 30-day money-back guarantee\./i,
      ),
    ).toBeVisible();
  });

  test('given: an anonymous user, should: show monthly/annual tabs with correct pricing', async ({
    page,
  }) => {
    await page.goto(path);

    // Check initial state (annual by default)
    await expect(page.getByRole('tab', { name: /annual/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );

    // Verify annual prices
    await expect(page.getByText('$25 /user per month')).toBeVisible();
    await expect(page.getByText('$45 /user per month')).toBeVisible();

    // Switch to monthly
    await page.getByRole('tab', { name: /monthly/i }).click();
    await expect(page.getByRole('tab', { name: /monthly/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );

    // Verify monthly prices
    await expect(page.getByText('$30 /user per month')).toBeVisible();
    await expect(page.getByText('$55 /user per month')).toBeVisible();

    // Check save annually message appears only on monthly tab
    const saveAnnuallyText = page.getByText(
      /save up to 20% on the annual plan/i,
    );
    await expect(saveAnnuallyText).toBeVisible();

    // Switch back to annual and verify message disappears
    await page.getByRole('tab', { name: /annual/i }).click();
    await expect(saveAnnuallyText).not.toBeVisible();
  });

  test('given: an anonymous user, should: show all pricing tiers with correct features', async ({
    page,
  }) => {
    await page.goto(path);

    // Check "Most Popular" badge on Business tier
    await expect(page.getByText(/most popular/i)).toBeVisible();

    // Verify Hobby tier features
    const hobbyFeatures = [
      'Unlimited public projects',
      'Community support',
      '1 member',
    ];
    for (const feature of hobbyFeatures) {
      await expect(page.getByText(feature)).toBeVisible();
    }

    // Verify Startup tier features
    const startupFeatures = [
      'Unlimited private projects',
      'Remove branding',
      'Up to 5 members',
    ];
    for (const feature of startupFeatures) {
      await expect(page.getByText(feature)).toBeVisible();
    }

    // Verify Business tier features
    const businessFeatures = ['SSO', 'Up to 25 members', 'Priority support'];
    for (const feature of businessFeatures) {
      await expect(page.getByText(feature)).toBeVisible();
    }

    // Verify Enterprise tier features
    const enterpriseFeatures = [
      'Custom Integrations',
      'Unlimited members',
      'Dedicated support',
    ];
    for (const feature of enterpriseFeatures) {
      await expect(page.getByText(feature)).toBeVisible();
    }
  });

  test('given: an anonymous user, should: have working links for free and enterprise tiers', async ({
    page,
  }) => {
    await page.goto(path);

    // Check Hobby tier "Get Started" link
    await expect(
      page.getByRole('link', { name: /get started/i }),
    ).toHaveAttribute('href', '/register');

    // Check Enterprise tier "Contact Sales" link
    await expect(
      page.getByRole('link', { name: /contact sales/i }),
    ).toHaveAttribute('href', '/contact-sales');
  });

  test('given: an anonymous user, should: lack any automatically detectable accessibility issues', async ({
    page,
  }) => {
    await page.goto(path);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules(['color-contrast'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
