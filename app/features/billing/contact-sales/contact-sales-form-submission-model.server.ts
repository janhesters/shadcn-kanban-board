import type { ContactSalesFormSubmission, Prisma } from '@prisma/client';

import { prisma } from '~/utils/database.server';

/* CREATE */

/**
 * Saves a new contact sales form submission to the database.
 *
 * @param submission - Parameters of the contact sales form submission that
 * should be created.
 * @returns The newly created contact sales form submission.
 */
export async function saveContactSalesFormSubmissionToDatabase(
  submission: Prisma.ContactSalesFormSubmissionCreateInput,
) {
  return await prisma.contactSalesFormSubmission.create({ data: submission });
}

/* READ */

/**
 * Retrieves all contact sales form submissions from the database.
 *
 * @returns A list of all contact sales form submissions.
 */
export async function retrieveContactSalesFormSubmissionsFromDatabase() {
  return await prisma.contactSalesFormSubmission.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Retrieves a contact sales form submission by its id.
 *
 * @param id - The id of the contact sales form submission to retrieve.
 * @returns The contact sales form submission or null if not found.
 */
export async function retrieveContactSalesFormSubmissionFromDatabaseById(
  id: ContactSalesFormSubmission['id'],
) {
  return await prisma.contactSalesFormSubmission.findUnique({ where: { id } });
}

/* DELETE */

/**
 * Deletes a contact sales form submission by its id.
 *
 * @param id - The id of the contact sales form submission to delete.
 * @returns The deleted contact sales form submission.
 */
export async function deleteContactSalesFormSubmissionFromDatabaseById(
  id: ContactSalesFormSubmission['id'],
) {
  return await prisma.contactSalesFormSubmission.delete({ where: { id } });
}
