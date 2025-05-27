import type {
  Notification,
  NotificationRecipient,
  Organization,
  UserAccount,
} from '@prisma/client';
import { Prisma } from '@prisma/client';

import { prisma } from '~/utils/database.server';

// Define the structure of the notification data we expect from the raw query
export type NotificationQueryResult = {
  recipientId: NotificationRecipient['id'];
  readAt: NotificationRecipient['readAt'];
  notificationId: Notification['id'];
  content: Notification['content'];
  createdAt: Notification['createdAt'];
};

/* CREATE */

export async function saveNotificationWithRecipientForUserAndOrganizationInDatabaseById({
  notification,
  recipient,
}: {
  notification: Prisma.NotificationUncheckedCreateInput;
  recipient: Omit<
    Prisma.NotificationRecipientUncheckedCreateInput,
    'notificationId'
  >;
}) {
  return prisma.notification.create({
    data: { ...notification, recipients: { create: recipient } },
    include: { recipients: true },
  });
}

/**
 * Creates a new notification with the specified content for a single user
 * within a given organization. Also creates the associated NotificationRecipient record.
 * This operation is atomic.
 *
 * @param userId - The ID of the user who will receive the notification.
 * @param organizationId - The ID of the organization context for the notification.
 * @param content - The JSON content of the notification.
 * @returns A promise resolving to the NotificationQueryResult for the newly created
 *          notification and its recipient, or null if creation failed unexpectedly.
 */
export async function createNotificationForUserInDatabaseById({
  userId,
  organizationId,
  content,
}: {
  userId: UserAccount['id'];
  organizationId: Organization['id'];
  content: Prisma.InputJsonValue; // Use Prisma's specific JSON type for input
}): Promise<NotificationQueryResult | null> {
  const newNotification = await prisma.notification.create({
    data: {
      organizationId: organizationId,
      content: content,
      // Create the recipient record simultaneously
      recipients: { create: { userId: userId } },
    },
    // Include the newly created recipient details
    include: {
      recipients: {
        where: { userId: userId }, // Ensure we only get the one we just created
        select: { id: true, readAt: true },
      },
    },
  });

  // Should always have one recipient from the create operation
  if (!newNotification.recipients || newNotification.recipients.length === 0) {
    // This case is unlikely but indicates something went wrong
    // console.error(
    //   `Failed to create recipient for notification ${newNotification.id}`,
    // );
    // Optionally delete the orphaned notification here if needed
    await prisma.notification.delete({ where: { id: newNotification.id } });
    // eslint-disable-next-line unicorn/no-null
    return null;
  }

  const recipient = newNotification.recipients[0];

  // Map to the desired NotificationQueryResult structure
  return {
    recipientId: recipient.id,
    readAt: recipient.readAt, // Will be null initially
    notificationId: newNotification.id,
    content: newNotification.content,
    createdAt: newNotification.createdAt,
  };
}

/**
 * Creates a new notification with the specified content for multiple users
 * within a given organization. Also creates the associated NotificationRecipient records.
 * This operation is atomic.
 *
 * @param userIds - An array of user IDs who will receive the notification.
 * @param organizationId - The ID of the organization context for the notification.
 * @param content - The JSON content of the notification.
 * @returns A promise resolving to an object containing the created Notification
 *          and the count of recipient records created, or null if creation failed.
 */
export async function createNotificationForUsersInDatabaseById({
  userIds,
  organizationId,
  content,
}: {
  userIds: UserAccount['id'][];
  organizationId: Organization['id'];
  content: Prisma.InputJsonValue; // Use Prisma's specific JSON type for input
}): Promise<{ notification: Notification | null; recipientCount: number }> {
  // Avoid unnecessary database call if no users are provided
  if (userIds.length === 0) {
    // console.warn('Attempted to create notification with zero recipients.');
    return {
      // eslint-disable-next-line unicorn/no-null
      notification: null, // Indicate no notification was created
      recipientCount: 0,
    };
  }

  // Map user IDs to the structure required by createMany
  const recipientData = userIds.map(id => ({ userId: id }));

  const newNotification = await prisma.notification.create({
    data: {
      organizationId: organizationId,
      content: content,
      // Create multiple recipient records simultaneously
      recipients: {
        createMany: {
          data: recipientData,
          // skipDuplicates: true, // Optional: useful if a userId might appear twice, though ideally the input array is unique
        },
      },
    },
  });

  // createMany for nested writes doesn't return the created records directly,
  // but it does guarantee atomicity. We return the count based on the input array length.
  // If skipDuplicates were true and duplicates existed, this count might be higher
  // than the actual records created, but it reflects the intended number.
  return {
    notification: newNotification,
    recipientCount: userIds.length, // Reflects the number of users intended
  };
}

/* READ */

/**
 * Retrieves a notification recipient record for a specific user and organization.
 *
 * This function ensures that the recipient record belongs to the specified user
 * and that the associated notification belongs to the specified organization.
 *
 * @param userId - The ID of the user who received the notification
 * @param organizationId - The ID of the organization the notification belongs to
 * @param recipientId - The ID of the notification recipient record to retrieve
 * @returns A promise resolving to the notification recipient record if found and
 *          matches the user/org criteria, or null if not found
 */
export async function retrieveNotificationRecipientForUserAndOrganizationFromDatabaseById({
  userId,
  organizationId,
  recipientId,
}: {
  userId: UserAccount['id'];
  organizationId: Organization['id'];
  recipientId: NotificationRecipient['id'];
}) {
  return await prisma.notificationRecipient.findUnique({
    where: { id: recipientId, userId, notification: { organizationId } },
  });
}

/**
 * Retrieves notification recipient records for a specific user and organization.
 *
 * This function ensures that the recipient records belong to the specified user
 * and that the associated notifications belong to the specified organization.
 *
 * @param userId - The ID of the user who received the notifications
 * @param organizationId - The ID of the organization the notifications belong to
 * @returns A promise resolving to an array of notification recipient records that
 *          match the user/org criteria
 */
export async function retrieveNotificationRecipientsForUserAndOrganizationFromDatabase({
  userId,
  organizationId,
}: {
  userId: UserAccount['id'];
  organizationId: Organization['id'];
}) {
  return await prisma.notificationRecipient.findMany({
    where: { userId, notification: { organizationId } },
  });
}

/**
 * Retrieves a notification panel record for a specific user and organization.
 *
 * This function ensures that the panel record belongs to the specified user
 * and that the associated organization matches the specified organization.
 *
 * @param userId - The ID of the user who owns the notification panel
 * @param organizationId - The ID of the organization the notification panel belongs to
 * @returns A promise resolving to the notification panel record if found and
 *          matches the user/org criteria, or null if not found
 */
export async function retrieveNotificationPanelForUserAndOrganizationFromDatabaseById({
  userId,
  organizationId,
}: {
  userId: UserAccount['id'];
  organizationId: Organization['id'];
}) {
  return await prisma.notificationPanel.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
  });
}

// Define the overall structure returned by the raw query
export type InitialNotificationsData = {
  allNotifications: NotificationQueryResult[];
  hasMoreAll: boolean;
  hasMoreUnread: boolean;
  lastOpenedAt: Date | null;
  unreadNotifications: NotificationQueryResult[];
};

/**
 * Retrieves initial notifications data for a user within an organization.
 *
 * This function performs a complex SQL query to fetch:
 * - The last time the user opened the notifications panel
 * - A limited set of unread notifications
 * - A limited set of all notifications (both read and unread)
 *
 * The results are ordered by creation date (newest first) with a secondary sort
 * on recipient ID for stable ordering.
 *
 * @param userId - The ID of the user to fetch notifications for
 * @param organizationId - The ID of the organization context
 * @param limit - Maximum number of notifications to return per category
 *
 * @returns A promise that resolves to:
 * - The notifications data object if successful
 * - A default object with empty arrays if no data is found
 */
export async function retrieveInitialNotificationsDataForUserAndOrganizationFromDatabaseById({
  userId,
  organizationId,
  allNotificationsLimit = 50, // Default limit per category
  unreadNotificationsLimit = 20, // Default limit per category
}: {
  userId: UserAccount['id'];
  organizationId: Organization['id'];
  allNotificationsLimit?: number;
  unreadNotificationsLimit?: number;
}): Promise<InitialNotificationsData | null> {
  // Ensure limit is a positive integer
  const safeAllNotificationsLimit = Math.max(
    1,
    Math.floor(allNotificationsLimit),
  );
  const safeUnreadNotificationsLimit = Math.max(
    1,
    Math.floor(unreadNotificationsLimit),
  );

  // Prisma's $queryRaw requires Prisma.sql template tag for parameters
  const results = await prisma.$queryRaw<[InitialNotificationsData]>`
    WITH PanelInfo AS (
      -- Select the lastOpenedAt for the specific user and organization
      SELECT "lastOpenedAt"
      FROM "NotificationPanel"
      WHERE "userId" = ${userId}
        AND "organizationId" = ${organizationId}
      LIMIT 1 -- Should be unique anyway due to @@unique constraint
    ),
    UnreadNotifications AS (
      -- Select the latest unread notifications for the user in the org
      SELECT
        nr.id as "recipientId",
        nr."readAt",
        n.id as "notificationId",
        n.content,
        n."createdAt"
      FROM "NotificationRecipient" nr
      JOIN "Notification" n ON nr."notificationId" = n.id
      WHERE nr."userId" = ${userId}
        AND n."organizationId" = ${organizationId}
        AND nr."readAt" IS NULL
      ORDER BY n."createdAt" DESC, nr.id DESC -- Primary sort by notification creation, secondary by recipient ID for stable order
      LIMIT ${safeUnreadNotificationsLimit + 1}
    ),
    AllNotifications AS (
      -- Select the latest notifications (read or unread) for the user in the org
      SELECT
        nr.id as "recipientId",
        nr."readAt",
        n.id as "notificationId",
        n.content,
        n."createdAt"
      FROM "NotificationRecipient" nr
      JOIN "Notification" n ON nr."notificationId" = n.id
      WHERE nr."userId" = ${userId}
        AND n."organizationId" = ${organizationId}
      ORDER BY n."createdAt" DESC, nr.id DESC -- Primary sort by notification creation, secondary by recipient ID for stable order
      LIMIT ${safeAllNotificationsLimit + 1}
    )
    -- Combine the results into a single JSON object
    SELECT
      (SELECT "lastOpenedAt" FROM PanelInfo) as "lastOpenedAt",
      -- Aggregate results into JSON arrays, COALESCE ensures we get [] instead of NULL if no rows match
      COALESCE((SELECT json_agg(u.* ORDER BY u."createdAt" DESC, u."recipientId" DESC) FROM UnreadNotifications u), '[]'::json) as "unreadNotifications",
      COALESCE((SELECT json_agg(a.* ORDER BY a."createdAt" DESC, a."recipientId" DESC) FROM AllNotifications a), '[]'::json) as "allNotifications",
      (SELECT COUNT(*) > ${safeUnreadNotificationsLimit} FROM UnreadNotifications)  AS "hasMoreUnread",
      (SELECT COUNT(*) > ${safeAllNotificationsLimit} FROM AllNotifications)    AS "hasMore";
  `;

  // $queryRaw returns an array, even if only one row is expected.
  if (results && results.length > 0) {
    // We need to explicitly cast the JSON results back if needed,
    // but Prisma attempts to map types based on the query result structure.
    // The defined `InitialNotificationsData` type helps TypeScript understand the shape.
    // Ensure the `NotificationQueryResult` matches the columns selected in the CTEs.
    return results[0];
  }

  // Should not happen if the organization exists, but good practice to handle.
  return {
    allNotifications: [],
    hasMoreAll: false,
    hasMoreUnread: false,
    // eslint-disable-next-line unicorn/no-null
    lastOpenedAt: null,
    unreadNotifications: [],
  };
}

// Shared type for paginated results
type PaginatedNotificationsResult = {
  notifications: NotificationQueryResult[];
  hasMore: boolean;
};

/**
 * Retrieves the next page of all notifications (read and unread) for a user
 * within an organization, using cursor-based pagination based on the
 * NotificationRecipient ID.
 *
 * @param userId - The ID of the user to fetch notifications for.
 * @param organizationId - The ID of the organization context.
 * @param limit - Maximum number of notifications to return in this batch.
 * @param cursor - The ID of the last NotificationRecipient from the previous page.
 *                 Used to fetch items *after* this cursor.
 * @returns A promise resolving to an object containing:
 *          - `notifications`: The next batch of NotificationQueryResult items.
 *          - `hasMore`: A boolean indicating if more notifications exist beyond this batch.
 */
export async function retrieveMoreAllNotificationsForUserAndOrganizationFromDatabaseById({
  userId,
  organizationId,
  limit = 10,
  cursor,
}: {
  userId: UserAccount['id'];
  organizationId: Organization['id'];
  limit?: number;
  cursor: NotificationRecipient['id']; // Cursor is the ID of the last item fetched
}): Promise<PaginatedNotificationsResult> {
  const safeLimit = Math.max(1, Math.floor(limit));

  const results = await prisma.notificationRecipient.findMany({
    // Filter through the related Notification
    where: { userId, notification: { organizationId } },
    // Order must be consistent with the initial fetch and across pagination calls
    orderBy: [{ notification: { createdAt: 'desc' } }, { id: 'desc' }],
    cursor: { id: cursor },
    skip: 1,
    take: safeLimit + 1,
    select: {
      id: true, // = recipientId
      readAt: true,
      notification: {
        select: {
          id: true, // = notificationId
          content: true,
          createdAt: true,
          // No need to select organizationId here unless specifically needed in the result
        },
      },
    },
  });

  const hasMore = results.length > safeLimit;
  const notificationsToReturn = results.slice(0, safeLimit);

  const notifications: NotificationQueryResult[] = notificationsToReturn.map(
    recipients => ({
      recipientId: recipients.id,
      readAt: recipients.readAt,
      notificationId: recipients.notification.id,
      content: recipients.notification.content,
      createdAt: recipients.notification.createdAt,
    }),
  );

  return { notifications, hasMore };
}

/**
 * Retrieves the next page of *unread* notifications for a user within an
 * organization, using cursor-based pagination based on the NotificationRecipient ID.
 *
 * @param userId - The ID of the user to fetch notifications for.
 * @param organizationId - The ID of the organization context.
 * @param limit - Maximum number of notifications to return in this batch.
 * @param cursor - The ID of the last *unread* NotificationRecipient from the
 *                 previous page. Used to fetch items *after* this cursor.
 * @returns A promise resolving to an object containing:
 *          - `notifications`: The next batch of unread NotificationQueryResult items.
 *          - `hasMore`: A boolean indicating if more unread notifications exist beyond this batch.
 */
export async function retrieveMoreUnreadNotificationsForUserAndOrganizationFromDatabaseById({
  userId,
  organizationId,
  limit = 10,
  cursor,
}: {
  userId: UserAccount['id'];
  organizationId: Organization['id'];
  limit?: number;
  cursor: NotificationRecipient['id']; // Cursor is the ID of the last item fetched
}): Promise<PaginatedNotificationsResult> {
  const safeLimit = Math.max(1, Math.floor(limit));

  const results = await prisma.notificationRecipient.findMany({
    where: {
      userId,
      // eslint-disable-next-line unicorn/no-null
      readAt: null, // Filter for unread
      // Corrected: Filter through the related Notification
      notification: { organizationId },
    },
    // Order must be consistent with the initial fetch and across pagination calls
    orderBy: [{ notification: { createdAt: 'desc' } }, { id: 'desc' }],
    cursor: {
      id: cursor,
    },
    skip: 1,
    take: safeLimit + 1,
    select: {
      id: true, // = recipientId
      readAt: true, // Will be null, but select for consistent structure
      notification: {
        select: {
          id: true, // = notificationId
          content: true,
          createdAt: true,
          // No need to select organizationId here unless specifically needed in the result
        },
      },
    },
  });

  const hasMore = results.length > safeLimit;
  const notificationsToReturn = results.slice(0, safeLimit);

  const notifications: NotificationQueryResult[] = notificationsToReturn.map(
    recipient => ({
      recipientId: recipient.id,
      readAt: recipient.readAt, // Should be null here
      notificationId: recipient.notification.id,
      content: recipient.notification.content,
      createdAt: recipient.notification.createdAt,
    }),
  );

  return { notifications, hasMore };
}

/* UPDATE */

/**
 * Updates the lastOpenedAt timestamp of a notification panel for a specific user
 * within an organization to the current time.
 *
 * @param userId - The ID of the user whose panel should be updated.
 * @param organizationId - The ID of the organization context.
 * @returns A promise resolving to the updated NotificationPanel if successful,
 *          or null if the panel wasn't found.
 */
export async function updateNotificationPanelLastOpenedAtForUserAndOrganizationInDatabaseById({
  userId,
  organizationId,
}: {
  userId: UserAccount['id'];
  organizationId: Organization['id'];
}) {
  try {
    return await prisma.notificationPanel.update({
      where: { userId_organizationId: { userId, organizationId } },
      data: { lastOpenedAt: new Date() },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      // This shouldn't happen because the action should check that the user
      // is a member and if they're a member, they also have a notification
      // panel for the organization.
      // eslint-disable-next-line unicorn/no-null
      return null;
    }

    throw error;
  }
}

/**
 * Marks a specific notification recipient record as read for a given user
 * within an organization by setting its `readAt` timestamp.
 *
 * Ensures that the user is updating their own notification recipient record
 * and that the record belongs to the specified organization.
 *
 * @param userId - The ID of the user performing the action.
 * @param organizationId - The ID of the organization context.
 * @param recipientId - The ID of the NotificationRecipient record to mark as read.
 * @returns A promise resolving to the updated NotificationQueryResult if successful,
 *          or null if the recipient wasn't found or didn't belong to the user/org.
 */
export async function markNotificationAsReadForUserAndOrganizationInDatabaseById({
  userId,
  organizationId,
  recipientId,
}: {
  userId: UserAccount['id'];
  organizationId: Organization['id'];
  recipientId: NotificationRecipient['id'];
}): Promise<NotificationQueryResult | null> {
  try {
    const updatedRecipient = await prisma.notificationRecipient.update({
      where: {
        // Ensure the recipient exists and belongs to the correct user
        id: recipientId,
        userId: userId,
        // Ensure the related notification belongs to the correct organization
        notification: { organizationId: organizationId },
      },
      data: {
        // Set readAt to the current time
        readAt: new Date(),
      },
      // Select the fields needed to return NotificationQueryResult
      select: {
        id: true,
        readAt: true,
        notification: { select: { id: true, content: true, createdAt: true } },
      },
    });

    // Map the Prisma result to the desired NotificationQueryResult structure
    return {
      recipientId: updatedRecipient.id,
      readAt: updatedRecipient.readAt,
      notificationId: updatedRecipient.notification.id,
      content: updatedRecipient.notification.content,
      createdAt: updatedRecipient.notification.createdAt,
    };
  } catch (error) {
    // Prisma throws an error (P2025) if the record to update is not found
    // based on the where clause. We can catch this to return null gracefully.
    // You might want more specific error handling depending on requirements.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      // console.warn(
      //   `NotificationRecipient ${recipientId} not found or access denied for user ${userId} in org ${organizationId}.`,
      // );
      // eslint-disable-next-line unicorn/no-null
      return null;
    }
    // Re-throw other unexpected errors
    // console.error(
    //   `Failed to mark notification recipient ${recipientId} as read:`,
    //   error,
    // );
    throw error;
  }
}

/**
 * Marks all unread notification recipient records as read for a specific user
 * within a given organization by setting their `readAt` timestamp.
 *
 * @param userId - The ID of the user whose notifications should be marked as
 * read.
 * @param organizationId - The ID of the organization context.
 * @returns A promise resolving to an object containing the count of records
 * updated.
 */
export async function markAllUnreadNotificationsAsReadForUserAndOrganizationInDatabaseById({
  userId,
  organizationId,
}: {
  userId: UserAccount['id'];
  organizationId: Organization['id'];
}): Promise<{ count: number }> {
  const result = await prisma.notificationRecipient.updateMany({
    where: {
      // Target records for the specific user
      userId: userId,
      // Target only unread records
      // eslint-disable-next-line unicorn/no-null
      readAt: null,
      // Ensure the related notification belongs to the correct organization
      notification: { organizationId: organizationId },
    },
    data: {
      // Set readAt to the current time
      readAt: new Date(),
    },
  });

  // updateMany returns an object { count: number }
  return result;
}
