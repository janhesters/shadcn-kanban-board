import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { createValidContactSalesFormData } from '~/features/billing/contact-sales/contact-sales-factories.server';
import {
  deleteContactSalesFormSubmissionFromDatabaseById,
  retrieveContactSalesFormSubmissionsFromDatabase,
} from '~/features/billing/contact-sales/contact-sales-form-submission-model.server';

const path = '/contact-sales';

test.describe('contact sales page', () => {
  test('given: a user visiting the page, should: have the correct title and form elements', async ({
    page,
  }) => {
    await page.goto(path);

    // The page title is correct
    await expect(page).toHaveTitle(/contact sales/i);

    // Form elements are visible
    await expect(page.getByLabel(/first name/i)).toBeVisible();
    await expect(page.getByLabel(/last name/i)).toBeVisible();
    await expect(page.getByLabel(/company/i)).toBeVisible();
    await expect(page.getByLabel(/work email/i)).toBeVisible();
    await expect(page.getByLabel(/phone number/i)).toBeVisible();
    await expect(page.getByLabel(/message/i)).toBeVisible();
    await expect(
      page.getByRole('button', { name: /contact sales/i }),
    ).toBeVisible();
  });

  test('given: a user submitting invalid data, should: show the correct error messages', async ({
    page,
  }) => {
    await page.goto(path);

    // Verify page content
    await expect(page.getByLabel(/first name/i)).toBeVisible();
    await expect(page.getByLabel(/last name/i)).toBeVisible();
    await expect(page.getByLabel(/company/i)).toBeVisible();
    await expect(page.getByLabel(/work email/i)).toBeVisible();
    await expect(page.getByLabel(/phone number/i)).toBeVisible();
    await expect(page.getByLabel(/message/i)).toBeVisible();
    await expect(
      page.getByRole('button', { name: /contact sales/i }),
    ).toBeVisible();

    // Submit empty form
    await page.getByRole('button', { name: /contact sales/i }).click();

    // Verify error messages
    await expect(page.getByText(/please enter your first name/i)).toBeVisible();
    await expect(page.getByText(/please enter your last name/i)).toBeVisible();
    await expect(
      page.getByText(/please enter your company name/i),
    ).toBeVisible();
    await expect(page.getByText(/please enter your work email/i)).toBeVisible();
    await expect(
      page.getByText(/please enter your phone number/i),
    ).toBeVisible();
    await expect(
      page.getByText(/please enter a message describing your needs/i),
    ).toBeVisible();

    // Test invalid email format
    await page.getByLabel(/work email/i).fill('invalid-email');
    await page.getByRole('button', { name: /contact sales/i }).click();
    await expect(
      page.getByText(/please enter a valid work email/i),
    ).toBeVisible();
  });

  test('given: a user submitting valid data, should: show success message', async ({
    page,
  }) => {
    await page.goto(path);

    const { intent: _, ...validData } = createValidContactSalesFormData();

    // Fill in the form with valid data
    await page.getByLabel(/first name/i).fill(validData.firstName);
    await page.getByLabel(/last name/i).fill(validData.lastName);
    await page.getByLabel(/company/i).fill(validData.companyName);
    await page.getByLabel(/work email/i).fill(validData.workEmail);
    await page.getByLabel(/phone number/i).fill(validData.phoneNumber);
    await page.getByLabel(/message/i).fill(validData.message);
    // Fill out twice to combat slow loads of JavaScript.
    await page.getByLabel(/first name/i).clear();
    await page.getByLabel(/first name/i).fill(validData.firstName);
    await page.getByLabel(/last name/i).clear();
    await page.getByLabel(/last name/i).fill(validData.lastName);
    await page.getByLabel(/company/i).clear();
    await page.getByLabel(/company/i).fill(validData.companyName);
    await page.getByLabel(/work email/i).clear();
    await page.getByLabel(/work email/i).fill(validData.workEmail);
    await page.getByLabel(/phone number/i).clear();
    await page.getByLabel(/phone number/i).fill(validData.phoneNumber);

    // Submit the form
    await page.getByRole('button', { name: /contact sales/i }).click();

    // Verify success message
    await expect(page.getByText(/success!/i)).toBeVisible();
    await expect(page.getByText(/thank you for contacting us/i)).toBeVisible();

    // Check database for the submission
    const submissions = await retrieveContactSalesFormSubmissionsFromDatabase();
    const savedSubmission = submissions.find(
      sub => sub.workEmail === validData.workEmail,
    );
    expect(savedSubmission).toMatchObject(validData);

    await deleteContactSalesFormSubmissionFromDatabaseById(savedSubmission!.id);
  });

  test.fixme(
    'given: an authenticated user who visited the page from their app, should: add the organization name and id in the form submission (so we can know which customer wants to go enterprise',
    async () => {
      //
    },
  );

  test('given: a user, should: lack any automatically detectable accessibility issues', async ({
    page,
  }) => {
    await page.goto(path);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules('color-contrast')
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
