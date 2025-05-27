import { faker } from '@faker-js/faker';
import { createId } from '@paralleldrive/cuid2';
import type { UserAccount } from '@prisma/client';

import type { Factory } from '~/utils/types';

/**
 * Creates a user account with populated values.
 *
 * @param userAccountParams - User account params to create user account with.
 * @returns A populated user account with given params.
 */
export const createPopulatedUserAccount: Factory<UserAccount> = ({
  id = createId(),
  supabaseUserId = createId(),
  email = faker.internet.email(),
  name = faker.person.fullName(),
  updatedAt = faker.date.recent({ days: 10 }),
  createdAt = faker.date.past({ years: 3, refDate: updatedAt }),
  imageUrl = faker.image.avatar(),
} = {}) => ({
  id,
  supabaseUserId,
  email,
  name,
  createdAt,
  updatedAt,
  imageUrl,
});
