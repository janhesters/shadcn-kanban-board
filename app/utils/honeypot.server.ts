import { createId } from '@paralleldrive/cuid2';
import { Honeypot, SpamError } from 'remix-utils/honeypot/server';

import type { Payload } from './to-form-data';
import { toFormData } from './to-form-data';

export const honeypot = new Honeypot({
  validFromFieldName: 'from__confirm',
  encryptionSeed: createId(), // Ideally it should be unique even between processes.
});

/**
 * Checks if the honeypot field is empty. If it's filled out, it throws an
 * error.
 *
 * @param data - The data to check for honeypot.
 * @throws Response - If the honeypot field is filled out.
 */
export async function checkHoneypot(data: Payload) {
  try {
    await honeypot.check(toFormData(data));
  } catch (error) {
    if (error instanceof SpamError) {
      throw new Response('Form not submitted properly', { status: 400 });
    }

    throw error;
  }
}
