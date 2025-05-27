import AxeBuilder from '@axe-core/playwright';
import { faker } from '@faker-js/faker';
import type { Organization } from '@prisma/client';
import {
  OrganizationMembershipRole,
  StripeSubscriptionStatus,
} from '@prisma/client';
import { expect, test } from 'playwright/test';
import {
  getPath,
  loginAndSaveUserAccountToDatabase,
  setupOrganizationAndLoginAsMember,
  setupTrialOrganizationAndLoginAsMember,
} from 'playwright/utils';

import { priceLookupKeysByTierAndInterval } from '~/features/billing/billing-constants';
import {
  createPopulatedStripeSubscriptionScheduleWithPhasesAndPrice,
  createPopulatedStripeSubscriptionWithItemsAndPrice,
} from '~/features/billing/billing-factories.server';
import { retrieveStripePriceWithProductFromDatabaseByLookupKey } from '~/features/billing/stripe-prices-model.server';
import { saveSubscriptionScheduleWithPhasesAndPriceToDatabase } from '~/features/billing/stripe-subscription-schedule-model.server';
import { createPopulatedOrganization } from '~/features/organizations/organizations-factories.server';
import {
  addMembersToOrganizationInDatabaseById,
  deleteOrganizationFromDatabaseById,
  retrieveOrganizationFromDatabaseById,
  saveOrganizationToDatabase,
} from '~/features/organizations/organizations-model.server';
import { createPopulatedUserAccount } from '~/features/user-accounts/user-accounts-factories.server';
import {
  deleteUserAccountFromDatabaseById,
  saveUserAccountToDatabase,
} from '~/features/user-accounts/user-accounts-model.server';
import { teardownOrganizationAndMember } from '~/test/test-utils';

const createPath = (organizationSlug: Organization['slug']) =>
  `/organizations/${organizationSlug}/settings/billing`;

test.describe('billing page', () => {
  test('given: a logged out user, should: redirect to login page with redirectTo parameter', async ({
    page,
  }) => {
    const { slug } = createPopulatedOrganization();
    const path = createPath(slug);
    await page.goto(path);

    const searchParameters = new URLSearchParams();
    searchParameters.append('redirectTo', path);
    expect(getPath(page)).toEqual(`/login?${searchParameters.toString()}`);
  });

  test('given: a logged in user who is NOT onboarded, should: redirect to onboarding', async ({
    page,
  }) => {
    // Setup user without name (implies not onboarded)
    const user = await loginAndSaveUserAccountToDatabase({
      user: createPopulatedUserAccount({ name: '' }),
      page,
    });
    // Create an org manually they _could_ belong to, but they aren't onboarded
    const organization = createPopulatedOrganization();
    await saveOrganizationToDatabase(organization);

    const path = createPath(organization.slug);
    await page.goto(path);

    // Expect redirect to user profile onboarding step (or org step depending on flow)
    expect(getPath(page)).toMatch(/\/onboarding\//);

    await deleteOrganizationFromDatabaseById(organization.id);
    await deleteUserAccountFromDatabaseById(user.id);
  });

  test('given: a user who is NOT a member of the organization, should: show 404 page', async ({
    page,
  }) => {
    // User 1 and their org
    const { organization: org1, user: user1 } =
      await setupOrganizationAndLoginAsMember({ page });
    // User 2 and their org
    const org2 = createPopulatedOrganization();
    await saveOrganizationToDatabase(org2);

    // User 1 tries to access User 2's org settings
    await page.goto(createPath(org2.slug));

    // Assert 404 content
    await expect(
      page.getByRole('heading', { name: /page not found/i, level: 1 }),
    ).toBeVisible();
    await expect(page).toHaveTitle(/404/i);

    // Cleanup
    await teardownOrganizationAndMember({ organization: org1, user: user1 });
    await deleteOrganizationFromDatabaseById(org2.id);
  });

  test('given: the user is a member (NOT an admin / owner), should: show a 404', async ({
    page,
  }) => {
    const { organization, user } = await setupOrganizationAndLoginAsMember({
      page,
      role: OrganizationMembershipRole.member,
    });

    // Navigate to billing page
    await page.goto(createPath(organization.slug));

    // Assert 404 content
    await expect(
      page.getByRole('heading', { name: /page not found/i, level: 1 }),
    ).toBeVisible();
    await expect(page).toHaveTitle(/404/i);

    await teardownOrganizationAndMember({ organization, user });
  });

  test('given: the user is an admin or owner and the organization is on a free trial, should: show a free-trial CTA to start paying in the sidebar', async ({
    page,
  }) => {
    const role = faker.helpers.arrayElement([
      OrganizationMembershipRole.admin,
      OrganizationMembershipRole.owner,
    ]);
    const { organization, user } = await setupTrialOrganizationAndLoginAsMember(
      { page, role },
    );

    // Navigate to billing page
    await page.goto(createPath(organization.slug));

    // Verify page title
    await expect(page).toHaveTitle(/billing | react router saas template/i);

    // Verify headings
    await expect(
      page.getByRole('heading', { name: /settings/i, level: 1 }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /billing/i, level: 2 }),
    ).toBeVisible();

    // Sidebar CTA card
    const sidebarNav = page.getByRole('navigation', { name: /sidebar/i });
    await expect(
      sidebarNav.getByText(/business plan \(trial\)/i),
    ).toBeVisible();
    await expect(sidebarNav.getByText(/trial ends on/i)).toBeVisible();
    await expect(
      sidebarNav.getByRole('button', { name: /add payment information/i }),
    ).toBeVisible();

    // Alert CTA banner
    const alertBanner = page.getByRole('alert');
    await expect(
      alertBanner.getByText(/your organization is currently on a free trial/i),
    ).toBeVisible();
    await expect(
      alertBanner.getByText(/your free trial will end on/i),
    ).toBeVisible();
    await expect(
      alertBanner.getByRole('button', { name: /add payment information/i }),
    ).toBeVisible();

    // Verify the regular UI
    const dl = page.locator('dl');

    // Current Plan → Business
    await expect(dl.locator('dt', { hasText: /current plan/i })).toBeVisible();
    await expect(dl.locator('dd', { hasText: /business/i })).toBeVisible();
    await expect(
      dl.locator('dd', { hasText: /\$85 per user billed monthly/i }),
    ).toBeVisible();

    // Users → 1 / 25
    await expect(dl.locator('dt', { hasText: /users/i })).toBeVisible();
    await expect(dl.locator('dd', { hasText: /1 \/ 25/i })).toBeVisible();
    await expect(
      page.getByRole('button', { name: /manage plan/i }),
    ).toBeVisible();

    // Projected Total → $85
    await expect(
      dl.locator('dt', { hasText: /projected total/i }),
    ).toBeVisible();
    await expect(dl.locator('dd', { hasText: /^\$85$/i })).toBeVisible();
    await expect(
      page.getByRole('link', { name: /manage users/i }),
    ).toHaveAttribute(
      'href',
      `/organizations/${organization.slug}/settings/members`,
    );

    // Next Billing Date → trial end date
    await expect(
      dl.locator('dt', { hasText: /next billing date/i }),
    ).toBeVisible();
    const nextBillingDateText = organization.trialEnd.toLocaleDateString(
      'en-US',
      { month: 'long', day: 'numeric', year: 'numeric' },
    );
    await expect(
      dl.locator('dd', { hasText: nextBillingDateText }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /view invoices/i }),
    ).toBeDisabled();

    // Open the modal to pick a plan
    await page
      .getByRole('button', { name: /add payment information/i })
      .first()
      .click();
    const modal = page.getByRole('dialog', { name: /choose your plan/i });
    await expect(modal).toBeVisible();
    await expect(
      modal.getByText(/pick a plan that fits your needs\./i),
    ).toBeVisible();

    // helper: current tab panel
    const activePanel = () =>
      modal.locator('div[role="tabpanel"]:not([hidden])');

    // --- 1. ANNUAL (default) ---
    await expect(page.getByRole('tab', { name: /annual/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );

    // Hobby card
    const hobbyAnnual = activePanel().locator(
      '[data-slot=card]:has([data-slot=card-title]:has-text("Hobby"))',
    );
    await expect(
      hobbyAnnual.getByText(/\$15\s*\/user per month/i),
    ).toBeVisible();
    await expect(hobbyAnnual.getByText(/-10%/i)).toBeVisible();
    await expect(
      hobbyAnnual.getByRole('button', { name: /subscribe now/i }),
    ).toHaveAttribute('value', 'annual_hobby_plan');

    // Startup card
    const startupAnnual = activePanel().locator(
      '[data-slot=card]:has([data-slot=card-title]:has-text("Startup"))',
    );
    await expect(
      startupAnnual.getByText(/\$25\s*\/user per month/i),
    ).toBeVisible();
    await expect(startupAnnual.getByText(/-15%/i)).toBeVisible();
    await expect(
      startupAnnual.getByRole('button', { name: /subscribe now/i }),
    ).toHaveAttribute('value', 'annual_startup_plan');

    // Business card
    const businessAnnual = activePanel().locator(
      '[data-slot=card]:has([data-slot=card-title]:has-text("Business"))',
    );
    await expect(
      businessAnnual.getByText(/\$45\s*\/user per month/i),
    ).toBeVisible();
    await expect(businessAnnual.getByText(/-20%/i)).toBeVisible();
    await expect(
      businessAnnual.getByRole('button', { name: /subscribe now/i }),
    ).toHaveAttribute('value', 'annual_business_plan');

    // Enterprise card
    const enterpriseAnnual = activePanel().locator(
      '[data-slot=card]:has([data-slot=card-title]:has-text("Enterprise"))',
    );
    await expect(enterpriseAnnual.getByText(/^custom$/i)).toBeVisible();
    await expect(
      enterpriseAnnual.getByRole('link', { name: /contact sales/i }),
    ).toHaveAttribute('href', '/contact-sales');

    // --- 2. MONTHLY ---
    await page.getByRole('tab', { name: /monthly/i }).click();
    await expect(page.getByRole('tab', { name: /monthly/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );

    const monthly = activePanel();

    // Hobby @ $17
    const hobbyMonthly = monthly.locator(
      '[data-slot=card]:has([data-slot=card-title]:has-text("Hobby"))',
    );
    await expect(
      hobbyMonthly.getByText(/\$17\s*\/user per month/i),
    ).toBeVisible();
    await expect(hobbyMonthly.getByText(/-10%/i)).toHaveCount(0);
    await expect(
      hobbyMonthly.getByRole('button', { name: /subscribe now/i }),
    ).toHaveAttribute('value', 'monthly_hobby_plan');

    // Startup @ $30
    const startupMonthly = monthly.locator(
      '[data-slot=card]:has([data-slot=card-title]:has-text("Startup"))',
    );
    await expect(
      startupMonthly.getByText(/\$30\s*\/user per month/i),
    ).toBeVisible();
    await expect(startupMonthly.getByText(/-15%/i)).toHaveCount(0);
    await expect(
      startupMonthly.getByRole('button', { name: /subscribe now/i }),
    ).toHaveAttribute('value', 'monthly_startup_plan');

    // Business @ $55
    const businessMonthly = monthly.locator(
      '[data-slot=card]:has([data-slot=card-title]:has-text("Business"))',
    );
    await expect(
      businessMonthly.getByText(/\$55\s*\/user per month/i),
    ).toBeVisible();
    await expect(businessMonthly.getByText(/-20%/i)).toHaveCount(0);
    await expect(
      businessMonthly.getByRole('button', { name: /subscribe now/i }),
    ).toHaveAttribute('value', 'monthly_business_plan');

    // Close the modal
    await modal.getByRole('button', { name: /close/i }).click();

    // 2) Open via alert CTA
    await alertBanner
      .getByRole('button', { name: /add payment information/i })
      .click();
    const modalFromAlert = page.getByRole('dialog', {
      name: /choose your plan/i,
    });
    await expect(modalFromAlert).toBeVisible();
    await modalFromAlert.getByRole('button', { name: /close/i }).click();

    // 3) Open via Manage Plan
    await page.getByRole('button', { name: /manage plan/i }).click();
    const modalFromManagePlan = page.getByRole('dialog', {
      name: /manage plan/i,
    });
    await expect(modalFromManagePlan).toBeVisible();
    await modalFromManagePlan.getByRole('button', { name: /close/i }).click();
    await expect(modalFromManagePlan).toBeHidden();

    await teardownOrganizationAndMember({ organization, user });
  });

  test('given: the user is an admin or an owner and the organization is on a free trial and has more members than a plan allows, should: NOT let the user subscribe to a plan that allows less seats', async ({
    page,
  }) => {
    const role = faker.helpers.arrayElement([
      OrganizationMembershipRole.admin,
      OrganizationMembershipRole.owner,
    ]);
    const { organization, user } = await setupTrialOrganizationAndLoginAsMember(
      {
        page,
        role,
      },
    );

    // Add member to organization
    const otherUser = createPopulatedUserAccount();
    await saveUserAccountToDatabase(otherUser);
    await addMembersToOrganizationInDatabaseById({
      id: organization.id,
      members: [otherUser.id],
      role: OrganizationMembershipRole.member,
    });

    // Visit the billing page
    await page.goto(createPath(organization.slug));

    // Verify page title
    await expect(page).toHaveTitle(/billing | react router saas template/i);

    // Verify headings
    await expect(
      page.getByRole('heading', { name: /settings/i, level: 1 }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /billing/i, level: 2 }),
    ).toBeVisible();

    // Alert CTA banner
    const alertBanner = page.getByRole('alert');
    await expect(
      alertBanner.getByText(/your organization is currently on a free trial/i),
    ).toBeVisible();
    await expect(
      alertBanner.getByText(/your free trial will end on/i),
    ).toBeVisible();
    await expect(
      alertBanner.getByRole('button', { name: /add payment information/i }),
    ).toBeVisible();

    // Open modal to pick a plan
    await alertBanner
      .getByRole('button', { name: /add payment information/i })
      .click();
    const modal = page.getByRole('dialog', { name: /choose your plan/i });
    await expect(modal).toBeVisible();

    // helper: current tab panel
    const activePanel = () =>
      modal.locator('div[role="tabpanel"]:not([hidden])');

    // --- ANNUAL (default) ---
    // Hobby (1 seat) should be disabled when you have 2 users
    const hobbyAnnual = activePanel().locator(
      '[data-slot=card]:has([data-slot=card-title]:has-text("Hobby"))',
    );
    await expect(
      hobbyAnnual.getByRole('button', { name: /subscribe now/i }),
    ).toBeDisabled();

    // And the explanatory copy appears
    await expect(
      modal.getByText(/why are some plans disabled\?/i),
    ).toBeVisible();
    await expect(
      modal.getByText(
        /you currently have 2 users, and the hobby plan only supports 1 user\./i,
      ),
    ).toBeVisible();
    await expect(
      modal.getByText(/please choose a plan that supports at least 2 seats\./i),
    ).toBeVisible();

    // Startup (10 seats) and Business (25 seats) remain enabled
    const startupAnnual = activePanel().locator(
      '[data-slot=card]:has([data-slot=card-title]:has-text("Startup"))',
    );
    await expect(
      startupAnnual.getByRole('button', { name: /subscribe now/i }),
    ).toBeEnabled();

    const businessAnnual = activePanel().locator(
      '[data-slot=card]:has([data-slot=card-title]:has-text("Business"))',
    );
    await expect(
      businessAnnual.getByRole('button', { name: /subscribe now/i }),
    ).toBeEnabled();

    // --- MONTHLY ---
    // Switch to monthly tab
    await page.getByRole('tab', { name: /monthly/i }).click();
    await expect(page.getByRole('tab', { name: /monthly/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    const monthlyPanel = activePanel();

    // Hobby monthly still disabled
    const hobbyMonthly = monthlyPanel.locator(
      '[data-slot=card]:has([data-slot=card-title]:has-text("Hobby"))',
    );
    await expect(
      hobbyMonthly.getByRole('button', { name: /subscribe now/i }),
    ).toBeDisabled();

    // Teardown
    await teardownOrganizationAndMember({ organization, user });
    await deleteUserAccountFromDatabaseById(otherUser.id);
  });

  test('given: the user is an admin or an owner and the organization is NOT on a free trial, should: let the user switch plans, view their invoices, and switch their billing email', async ({
    page,
  }) => {
    const role = faker.helpers.arrayElement([
      OrganizationMembershipRole.admin,
      OrganizationMembershipRole.owner,
    ]);
    const { organization, user } = await setupOrganizationAndLoginAsMember({
      page,
      role,
      lookupKey: priceLookupKeysByTierAndInterval.mid.annual,
    });

    // Navigate to billing page
    await page.goto(createPath(organization.slug));

    // Verify page title + headings
    await expect(page).toHaveTitle(/billing | react router saas template/i);
    await expect(
      page.getByRole('heading', { name: /settings/i, level: 1 }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /billing/i, level: 2 }),
    ).toBeVisible();

    // "Your Plan" section
    await expect(
      page.getByRole('heading', { name: /your plan/i, level: 3 }),
    ).toBeVisible();

    const planForm = page.locator('form[action*="/settings/billing"]');
    const planDl = planForm.locator('dl');

    // pull subscription & price info
    const subscription = organization.stripeSubscriptions[0];
    const item = subscription.items[0];
    const price = item.price;
    const interval = price.interval === 'month' ? 'monthly' : 'annually';
    const unitAmount = price.unitAmount / 100;
    const maxSeats = price.product.maxSeats;
    const seatsUsed = 1;
    const projectedTotal = unitAmount * seatsUsed;
    const nextDate = item.currentPeriodEnd.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    // Current Plan → name + price/interval
    await expect(
      planDl.locator('dt', { hasText: /current plan/i }),
    ).toBeVisible();
    await expect(
      planDl.locator('dd', {
        hasText: new RegExp(subscription.items[0].price.product.name, 'i'),
      }),
    ).toBeVisible();
    await expect(
      planDl.locator('dd', {
        hasText: new RegExp(
          `\\$${unitAmount}\\s*per user billed ${interval}`,
          'i',
        ),
      }),
    ).toBeVisible();

    // Manage plan button
    await expect(
      planForm.getByRole('button', { name: /manage plan/i }),
    ).toBeVisible();

    // Users → seatsUsed / maxSeats
    await expect(planDl.locator('dt', { hasText: /users/i })).toBeVisible();
    await expect(
      planDl.locator('dd', {
        hasText: new RegExp(`^${seatsUsed} \\/ ${maxSeats}$`, 'i'),
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /manage users/i }),
    ).toHaveAttribute(
      'href',
      `/organizations/${organization.slug}/settings/members`,
    );

    // Projected Total
    await expect(
      planDl.locator('dt', { hasText: /projected total/i }),
    ).toBeVisible();
    await expect(
      planDl.locator('dd', {
        hasText: new RegExp(`^\\$${projectedTotal}$`, 'i'),
      }),
    ).toBeVisible();

    // Next Billing Date
    await expect(
      planDl.locator('dt', { hasText: /next billing date/i }),
    ).toBeVisible();
    await expect(planDl.locator('dd', { hasText: nextDate })).toBeVisible();

    // View Invoices
    const viewInvoices = planForm.getByRole('button', {
      name: /view invoices/i,
    });
    await expect(viewInvoices).toBeVisible();
    await expect(viewInvoices).toHaveAttribute('name', 'intent');
    await expect(viewInvoices).toHaveAttribute('value', 'viewInvoices');

    // "Payment Information" section
    await expect(
      page.getByRole('heading', { name: /payment information/i, level: 3 }),
    ).toBeVisible();
    const paymentDl = page.locator('dl').nth(1);

    // Billing Email
    await expect(
      paymentDl.locator('dt', { hasText: /billing email/i }),
    ).toBeVisible();
    await expect(paymentDl.locator('dd')).toHaveText(organization.billingEmail);
    await expect(
      paymentDl.getByRole('button', { name: /edit/i }),
    ).toBeVisible();

    //
    // ——— OPEN AND ASSERT THE “MANAGE PLAN” MODAL ——————————————
    //
    await planForm.getByRole('button', { name: /manage plan/i }).click();
    const planModal = page.getByRole('dialog', { name: /manage plan/i });
    await expect(planModal).toBeVisible();

    // Annual tab selected by default
    await expect(
      planModal.getByRole('tab', { name: /annual/i }),
    ).toHaveAttribute('aria-selected', 'true');
    await expect(
      planModal.getByRole('tab', { name: /monthly/i }),
    ).toBeVisible();

    // Annual panel: 1 Current Plan, 1 Upgrade, Contact Sales, Cancel subscription
    await expect(
      planModal.getByRole('button', { name: /current plan/i }),
    ).toHaveCount(1);
    await expect(
      planModal.getByRole('button', { name: /upgrade/i }),
    ).toHaveCount(1);
    await expect(
      planModal.getByRole('link', { name: /contact sales/i }),
    ).toBeVisible();
    await expect(
      planModal.getByRole('button', { name: /cancel subscription/i }),
    ).toBeVisible();

    // ——— SWITCH TO MONTHLY TAB ——————————————————————————————
    await planModal.getByRole('tab', { name: /monthly/i }).click();
    await expect(
      planModal.getByRole('tab', { name: /monthly/i }),
    ).toHaveAttribute('aria-selected', 'true');
    await expect(
      planModal.getByText(/save up to 20% on the annual plan\./i),
    ).toBeVisible();

    // Monthly panel:
    const monthlyPanel = () =>
      planModal.locator('div[role="tabpanel"]:not([hidden])');
    await expect(
      monthlyPanel().getByRole('button', { name: /downgrade/i }),
    ).toHaveAttribute('value', 'monthly_hobby_plan');
    await expect(
      monthlyPanel().getByRole('button', { name: /switch to monthly/i }),
    ).toHaveAttribute('value', 'monthly_startup_plan');
    await expect(
      monthlyPanel().getByRole('button', { name: /upgrade/i }),
    ).toHaveAttribute('value', 'monthly_business_plan');

    // ——— OPEN AND ASSERT THE “CANCEL SUBSCRIPTION” MODAL ——————————
    await planModal
      .getByRole('button', { name: /cancel subscription/i })
      .click();
    const cancelPlanModal = page.getByRole('dialog', {
      name: /are you sure you want to cancel your subscription\?/i,
    });
    await expect(cancelPlanModal).toBeVisible();

    // Cancel dialog header & description
    await expect(
      cancelPlanModal.getByRole('heading', {
        name: /are you sure you want to cancel your subscription\?/i,
      }),
    ).toBeVisible();
    await expect(
      cancelPlanModal.getByText(
        /canceling your subscription means you will lose access to your benefits at the end of your billing cycle\./i,
      ),
    ).toBeVisible();

    // List of features (4 items)
    const features = cancelPlanModal.locator('ul > li');
    await expect(features).toHaveCount(4);

    // Footer buttons: "Select a different plan" + Cancel subscription form button
    await expect(
      cancelPlanModal.getByRole('button', { name: /select a different plan/i }),
    ).toBeVisible();
    const confirmCancel = cancelPlanModal.getByRole('button', {
      name: /cancel subscription/i,
    });
    await expect(confirmCancel).toHaveAttribute('name', 'intent');
    await expect(confirmCancel).toHaveAttribute('value', 'cancelSubscription');

    // Close the manage-plan modal
    await cancelPlanModal.getByRole('button', { name: /close/i }).click();

    //
    // ——— OPEN AND ASSERT THE “EDIT BILLING EMAIL” MODAL —————————
    //
    await paymentDl.getByRole('button', { name: /edit/i }).click();
    const emailModal = page.getByRole('dialog', {
      name: /edit your billing email/i,
    });
    await expect(emailModal).toBeVisible();

    // Fill new email and save
    const newEmail = faker.internet.email();
    const emailInput = emailModal.getByLabel(/email/i);
    await emailInput.fill(newEmail);
    await emailModal.getByRole('button', { name: /save changes/i }).click();

    // Toast should appear then close the modal
    await expect(
      page
        .getByRole('region', { name: /notifications/i })
        .getByText(/billing email updated/i),
    ).toBeVisible();
    await emailModal.getByRole('button', { name: /close/i }).click();
    await expect(emailModal).toBeHidden();

    // UI should update
    await expect(paymentDl.locator('dd')).toHaveText(newEmail);

    // DB should persist new email
    const updatedOrg = await retrieveOrganizationFromDatabaseById(
      organization.id,
    );
    expect(updatedOrg?.billingEmail).toEqual(newEmail);

    await teardownOrganizationAndMember({ organization, user });
  });

  test("given: the user's subscription is set to cancel in the future, should: show a warning and a button to let the user resume the subscription", async ({
    page,
  }) => {
    const role = faker.helpers.arrayElement([
      OrganizationMembershipRole.admin,
      OrganizationMembershipRole.owner,
    ]);
    const { organization, user } = await setupOrganizationAndLoginAsMember({
      page,
      role,
      subscription: createPopulatedStripeSubscriptionWithItemsAndPrice({
        cancelAtPeriodEnd: true,
      }),
    });

    await page.goto(createPath(organization.slug));

    // banner container
    const pendingBanner = page.getByRole('alert');
    await expect(pendingBanner).toBeVisible();

    // title & description slots
    await expect(
      pendingBanner.getByText(/your subscription is ending soon\./i),
    ).toBeVisible();

    const endDate =
      organization.stripeSubscriptions[0].items[0].currentPeriodEnd.toLocaleDateString(
        'en-US',
        {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        },
      );
    await expect(
      pendingBanner.getByText(
        new RegExp(`Your subscription runs out on ${endDate}\\.`),
      ),
    ).toBeVisible();

    // resume button
    const resumeButton = pendingBanner.getByRole('button', {
      name: /resume subscription/i,
    });
    await expect(resumeButton).toBeVisible();

    // click & expect toast + disappear
    await resumeButton.click();
    await expect(
      page
        .getByRole('region', { name: /notifications/i })
        .getByText(/subscription resumed/i),
    ).toBeVisible();
    await expect(pendingBanner).toBeHidden();

    await teardownOrganizationAndMember({ organization, user });
  });

  test("given: the user's subscription is cancelled in the past, should: show an inactive banner and sidebar card, and let them open the reactivate modal", async ({
    page,
  }) => {
    // pick an admin or owner role
    const role = faker.helpers.arrayElement([
      OrganizationMembershipRole.admin,
      OrganizationMembershipRole.owner,
    ]);

    // seed an org with a terminal canceled subscription
    const { organization, user } = await setupOrganizationAndLoginAsMember({
      page,
      role,
      subscription: createPopulatedStripeSubscriptionWithItemsAndPrice({
        status: StripeSubscriptionStatus.canceled,
        items: [
          {
            // make sure there's a currentPeriodEnd in the past
            currentPeriodEnd: faker.date.past(),
          },
        ],
      }),
    });

    // navigate to billing
    await page.goto(createPath(organization.slug));

    //
    // — alert banner —
    //
    const inactiveBanner = page.getByRole('alert');
    await expect(inactiveBanner).toBeVisible();
    await expect(
      inactiveBanner.getByText(/your subscription is inactive\./i),
    ).toBeVisible();
    await expect(
      inactiveBanner.getByText(/your subscription has been cancelled\./i),
    ).toBeVisible();

    // banner "Reactivate subscription" button
    const bannerReactivate = inactiveBanner.getByRole('button', {
      name: /reactivate subscription/i,
    });
    await expect(bannerReactivate).toBeVisible();

    //
    // — sidebar card —
    //
    const sidebar = page.getByRole('navigation', { name: /sidebar/i });
    const inactiveCard = sidebar.locator('[data-slot="card"]');

    await expect(
      inactiveCard.getByText(/subscription inactive/i),
    ).toBeVisible();
    await expect(
      inactiveCard.getByText(/renew to keep using the app\./i),
    ).toBeVisible();

    // sidebar "Choose plan" button
    const choosePlanButton = inactiveCard.getByRole('button', {
      name: /choose plan/i,
    });
    await expect(choosePlanButton).toBeVisible();

    //
    // clicking the sidebar button opens the reactivate modal
    //
    await choosePlanButton.click();
    const reactivateModal = page.getByRole('dialog', {
      name: /choose your plan to reactivate your subscription/i,
    });
    await expect(reactivateModal).toBeVisible();
    // close it to reset state
    await reactivateModal.getByRole('button', { name: /close/i }).click();
    await expect(reactivateModal).toBeHidden();

    //
    // clicking the banner button opens the same reactivate modal
    //
    await bannerReactivate.click();
    await expect(
      page.getByRole('dialog', {
        name: /choose your plan to reactivate your subscription/i,
      }),
    ).toBeVisible();

    // cleanup
    await teardownOrganizationAndMember({ organization, user });
  });

  test("given: the user's subscription is marked to downgrade, should: show a pending-downgrade banner and let the user keep their current subscription", async ({
    page,
  }) => {
    // pick an admin or owner
    const role = faker.helpers.arrayElement([
      OrganizationMembershipRole.admin,
      OrganizationMembershipRole.owner,
    ]);

    // seed an org with an active subscription
    const { organization, user } = await setupOrganizationAndLoginAsMember({
      page,
      role,
      lookupKey: priceLookupKeysByTierAndInterval.mid.monthly,
    });
    const subscription = organization.stripeSubscriptions[0];

    // schedule a downgrade: pick a lower price
    const lowerPrice =
      await retrieveStripePriceWithProductFromDatabaseByLookupKey(
        priceLookupKeysByTierAndInterval.low.monthly,
      );
    const schedule =
      createPopulatedStripeSubscriptionScheduleWithPhasesAndPrice({
        subscriptionId: subscription.stripeId,
        phases: [{ price: lowerPrice!, startDate: faker.date.soon() }],
      });
    await saveSubscriptionScheduleWithPhasesAndPriceToDatabase(schedule);

    // go to billing
    await page.goto(createPath(organization.slug));

    // — pending-downgrade banner —
    const pendingBanner = page.getByRole('alert');
    await expect(pendingBanner).toBeVisible();
    await expect(pendingBanner.getByText(/downgrade scheduled/i)).toBeVisible();

    // build expected description
    const phase = schedule.phases[0];
    const billingInterval =
      phase.price.interval === 'month' ? 'monthly' : 'annually';
    const downgradeDate = phase.startDate.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    const descRegex = new RegExp(
      `Your subscription will downgrade to the hobby \\(${billingInterval}\\) plan on ${downgradeDate}\\.`,
      'i',
    );
    await expect(pendingBanner.getByText(descRegex)).toBeVisible();

    // “Keep current subscription” CTA
    const keepButton = pendingBanner.getByRole('button', {
      name: /keep current subscription/i,
    });
    await expect(keepButton).toBeVisible();

    // click it → should show success toast and hide the banner
    await keepButton.click();
    await expect(
      page
        .getByRole('region', { name: /notifications/i })
        .getByText(/current subscription kept/i),
    ).toBeVisible();
    await expect(pendingBanner).toBeHidden();

    await teardownOrganizationAndMember({ organization, user });
  });

  test('given: the user is on an annual subscription and has a plan change for the same tier but monthly scheduled, should: show the pending downgrade banner', async ({
    page,
  }) => {
    // pick an admin or owner role
    const role = faker.helpers.arrayElement([
      OrganizationMembershipRole.admin,
      OrganizationMembershipRole.owner,
    ]);

    // seed an org with an ANNUAL “high” (e.g. Business) subscription
    const { organization, user } = await setupOrganizationAndLoginAsMember({
      page,
      role,
      lookupKey: priceLookupKeysByTierAndInterval.high.annual,
    });
    const subscription = organization.stripeSubscriptions[0];

    // schedule a switch to the MONTHLY version of the same tier
    const monthlyPrice =
      await retrieveStripePriceWithProductFromDatabaseByLookupKey(
        priceLookupKeysByTierAndInterval.high.monthly,
      );
    const schedule =
      createPopulatedStripeSubscriptionScheduleWithPhasesAndPrice({
        subscriptionId: subscription.stripeId,
        phases: [
          {
            price: monthlyPrice!,
            startDate: faker.date.soon(),
          },
        ],
      });
    await saveSubscriptionScheduleWithPhasesAndPriceToDatabase(schedule);

    // navigate to billing
    await page.goto(createPath(organization.slug));

    // — pending-downgrade banner —
    const pendingBanner = page.getByRole('alert');
    await expect(pendingBanner).toBeVisible();
    await expect(pendingBanner.getByText(/downgrade scheduled/i)).toBeVisible();

    // build expected description
    const phase = schedule.phases[0];
    const switchDate = phase.startDate.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    const descRegex = new RegExp(
      `Your subscription will downgrade to the business \\(monthly\\) plan on ${switchDate}\\.`,
      'i',
    );
    await expect(pendingBanner.getByText(descRegex)).toBeVisible();

    // “Keep current subscription” CTA
    const keepButton = pendingBanner.getByRole('button', {
      name: /keep current subscription/i,
    });
    await expect(keepButton).toBeVisible();

    // click it → should hide banner and show toast
    await keepButton.click();
    await expect(
      page
        .getByRole('region', { name: /notifications/i })
        .getByText(/current subscription kept/i),
    ).toBeVisible();
    await expect(pendingBanner).toBeHidden();

    // cleanup
    await teardownOrganizationAndMember({ organization, user });
  });

  // ========================================================================
  // Accessibility Tests
  // ========================================================================
  test('given: an owner user, should: lack automatically detectable accessibility issues', async ({
    page,
  }) => {
    const data = await setupOrganizationAndLoginAsMember({
      page,
      role: OrganizationMembershipRole.owner,
    });

    await page.goto(createPath(data.organization.slug));

    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules(['color-contrast', 'definition-list', 'dlitem'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);

    await teardownOrganizationAndMember(data);
  });
});
