import AxeBuilder from '@axe-core/playwright';
import { faker } from '@faker-js/faker';
import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { href } from 'react-router';

import type { LinkNotificationProps } from '~/features/notifications/notification-components';
import {
  createPopulatedLinkNotificationData,
  createPopulatedNotification,
  createPopulatedNotificationRecipient,
} from '~/features/notifications/notifications-factories.server';
import { saveNotificationWithRecipientForUserAndOrganizationInDatabaseById } from '~/features/notifications/notifications-model.server';
import { teardownOrganizationAndMember } from '~/test/test-utils';

import { setupOrganizationAndLoginAsMember } from '../../utils';

const createPath = (organizationSlug: string) =>
  href('/organizations/:organizationSlug/dashboard', {
    organizationSlug,
  });

/**
 * Helper to create multiple notifications for a user in an organization
 */
async function setup({
  page,
  count = 1,
  markAsRead = false,
}: {
  page: Page;
  count?: number;
  markAsRead?: boolean;
}) {
  const { organization, user } = await setupOrganizationAndLoginAsMember({
    page,
  });

  // Create notifications
  const notifications = Array.from({ length: count })
    .map(() => {
      const content = createPopulatedLinkNotificationData({
        href: href('/organizations/:organizationSlug/settings/billing', {
          organizationSlug: organization.slug,
        }),
      });

      return createPopulatedNotification({
        organizationId: organization.id,
        content,
      });
    })
    // Sort by createdAt descending (newest first, oldest last)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const notificationsWithRecipients = await Promise.all(
    notifications.map(notification => {
      const { notificationId: _, ...recipient } =
        createPopulatedNotificationRecipient({
          notificationId: notification.id,
          userId: user.id,
          // eslint-disable-next-line unicorn/no-null
          readAt: markAsRead ? faker.date.recent() : null,
          createdAt: notification.createdAt,
          updatedAt: notification.createdAt,
        });

      return saveNotificationWithRecipientForUserAndOrganizationInDatabaseById({
        notification,
        recipient,
      });
    }),
  );

  return { organization, user, notifications, notificationsWithRecipients };
}

test.describe('notifications', () => {
  test('given: no notifications, should: show empty state', async ({
    page,
  }) => {
    const { organization, user } = await setup({ page, count: 0 });

    await page.goto(createPath(organization.slug));

    // Open notifications panel
    await page.getByRole('button', { name: /open notifications/i }).click();

    // Check empty state of unread notifications
    await expect(
      page.getByText(/your notifications will show up here/i),
    ).toBeVisible();

    // Check empty state of all notifications
    await page.getByRole('tab', { name: /all/i }).click();
    await expect(
      page.getByText(/your notifications will show up here/i),
    ).toBeVisible();

    await teardownOrganizationAndMember({ organization, user });
  });

  test('given: a user with notifications, should: allow them to mark all as read', async ({
    page,
  }) => {
    const { organization, user, notifications } = await setup({
      page,
      count: 2,
    });

    await page.goto(createPath(organization.slug));

    // Open notifications panel
    await page
      .getByRole('button', { name: /open unread notifications/i })
      .click();

    // Opening the panel should remove the badge
    await expect(
      page.getByRole('button', { name: /open unread notifications/i }),
    ).toBeHidden();
    await expect(
      page.getByRole('button', { name: /open notifications/i }),
    ).toBeVisible();

    // Check that all notifications are visible in the unread tab
    for (const notification of notifications) {
      await expect(
        page.getByText((notification.content as LinkNotificationProps).text),
      ).toBeVisible();
    }

    // Mark all as read
    await page.getByRole('button', { name: /mark all as read/i }).click();

    // Check that the unread notifications are now empty
    await expect(
      page.getByText(/your notifications will show up here/i),
    ).toBeVisible();

    // Navigate to all notifications tab and check that all notifications are
    // still visible
    await page.getByRole('tab', { name: /all/i }).click();
    for (const notification of notifications) {
      await expect(
        page.getByText((notification.content as LinkNotificationProps).text),
      ).toBeVisible();
    }

    await teardownOrganizationAndMember({ organization, user });
  });

  test.describe('link notifications', () => {
    test('given: a user with a link notification, should: be able to mark them as read individually', async ({
      page,
    }) => {
      const { organization, user, notifications } = await setup({
        page,
        count: 3,
      });

      await page.goto(createPath(organization.slug));

      // Open notifications panel
      await page
        .getByRole('button', { name: /open unread notifications/i })
        .click();
      // Delay a little bit to let JavaScript load
      await expect(
        page.getByRole('button', { name: /mark all as read/i }),
      ).toBeVisible();
      await expect(page.getByRole('tab', { name: /unread/i })).toBeVisible();
      await expect(page.getByRole('tab', { name: /all/i })).toBeVisible();

      // Check that all notifications are visible in the unread tab
      for (const notification of notifications) {
        await expect(
          page.getByText((notification.content as LinkNotificationProps).text),
        ).toBeVisible();
      }

      // Mark the last notification as read
      const lastNotification = page.getByRole('link', {
        name: (notifications[2].content as LinkNotificationProps).text,
      });
      await expect(lastNotification).toHaveAttribute(
        'href',
        href('/organizations/:organizationSlug/settings/billing', {
          organizationSlug: organization.slug,
        }),
      );

      // Mark the notification as read
      await lastNotification.hover();
      await lastNotification
        .getByRole('button', { name: /open notification menu/i })
        .click();
      await page.getByRole('menuitem', { name: /mark as read/i }).click();

      // Check that the notification is now read
      await expect(
        page.getByText(
          (notifications[2].content as LinkNotificationProps).text,
        ),
      ).toBeHidden();

      // Check in the all notifications tab that all notifications are visible
      await page.getByRole('tab', { name: /all/i }).click();
      for (const notification of notifications) {
        await expect(
          page.getByText((notification.content as LinkNotificationProps).text),
        ).toBeVisible();
      }

      // Mark the second notification as read
      const secondNotification = page.getByRole('link', {
        name: (notifications[1].content as LinkNotificationProps).text,
      });
      await expect(secondNotification).toHaveAttribute(
        'href',
        href('/organizations/:organizationSlug/settings/billing', {
          organizationSlug: organization.slug,
        }),
      );

      // Mark the notification as read
      await secondNotification.hover();
      await secondNotification
        .getByRole('button', { name: /open notification menu/i })
        .click();
      await page.getByRole('menuitem', { name: /mark as read/i }).click();

      // Check that the notification is now read
      await page.getByRole('tab', { name: /unread/i }).click();
      await expect(
        page.getByText(
          (notifications[1].content as LinkNotificationProps).text,
        ),
      ).toBeHidden();

      await teardownOrganizationAndMember({ organization, user });
    });
  });

  test('given: open notifications panel, should: lack automatically detectable accessibility issues', async ({
    page,
  }) => {
    const { organization, user } = await setup({ page, count: 2 });

    await page.goto(createPath(organization.slug));

    // Open notifications panel
    await page
      .getByRole('button', { name: /open unread notifications/i })
      .click();

    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules(['color-contrast'])
      // The Radix popover is rendered outside any land marks and we can't
      // change that, so we exclude it from the accessibility scan.
      .exclude('div[data-radix-popper-content-wrapper=""]')
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);

    await teardownOrganizationAndMember({ organization, user });
  });
});
